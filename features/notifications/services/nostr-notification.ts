import { Event as NostrEvent } from 'nostr-tools';
import { useNotificationStore } from '../../../stores/notification.store';
import { Notification, NotificationType, NotificationUser } from '../../../types/notification';
import { fetchProfileForNotification } from '../../profile/services/profile-cache';
import { fetchPostData } from './post-cache';

export class NostrNotificationService {
  private userPubkey: string | null = null;
  // 著者(pubkey)ごとの最新コンタクトリスト状態を保持
  private contactState: Map<string, { created_at: number; contacts: Set<string> }> = new Map();

  setUserPubkey(pubkey: string) {
    this.userPubkey = pubkey;
  }

  async processEvent(event: NostrEvent) {
    if (!this.userPubkey) return;

    // イベントの種類に応じて通知を生成
    switch (event.kind) {
      case 1: // テキストノート
        await this.processTextNote(event);
        break;
      case 3: // コンタクトリスト（フォロー）
        await this.processContactList(event);
        break;
      case 6: // リポスト
        await this.processRepost(event);
        break;
      case 7: // リアクション（いいね）
        await this.processReaction(event);
        break;
      case 9735: // Zap
        await this.processZap(event);
        break;
    }
  }

  private async processTextNote(event: NostrEvent) {
    if (!this.userPubkey) return;

    // メンション検出 - 複数の形式をサポート
    let isMention = false;

    // 1. #[数字] 形式のメンション検出
    const mentionRegex = /#\[(\d+)\]/g;
    const mentions = event.content.matchAll(mentionRegex);
    
    for (const match of mentions) {
      const tagIndex = parseInt(match[1]);
      const tag = event.tags[tagIndex];
      
      if (tag && tag[0] === 'p' && tag[1] === this.userPubkey) {
        isMention = true;
        break;
      }
    }

    // 2. pタグで直接メンションされているかチェック
    if (!isMention) {
      const pTags = event.tags.filter(tag => 
        tag[0] === 'p' && tag[1] === this.userPubkey
      );
      if (pTags.length > 0) {
        isMention = true;
      }
    }

    // 3. @npub... や nostr:npub... 形式のメンション検出
    if (!isMention && this.userPubkey) {
      try {
        const { nip19 } = await import('nostr-tools');
        const userNpub = nip19.npubEncode(this.userPubkey);
        
        // @npub... または nostr:npub... パターンを検出
        const npubPattern = new RegExp(`(@|nostr:)${userNpub}`, 'i');
        if (npubPattern.test(event.content)) {
          isMention = true;
        }
      } catch (error) {
        console.error('Error encoding npub:', error);
      }
    }

    // メンション通知を作成
    if (isMention) {
      // メンション先の投稿を特定（NIP-10の'mention'マーカーを優先）
      const mentionTargetTag = event.tags.find(tag => tag[0] === 'e' && tag[3] === 'mention');
      const fallbackMentionTag = event.tags.find(tag => tag[0] === 'e' && !tag[3]);
      const rawTargetPostId = mentionTargetTag?.[1] ?? fallbackMentionTag?.[1] ?? null;
      const targetPostId = rawTargetPostId && rawTargetPostId !== event.id ? rawTargetPostId : null;

      const mentionedPostData = targetPostId ? await fetchPostData(targetPostId) : null;

      await this.createNotification({
        type: 'mention',
        event,
        content: event.content,
        postId: mentionedPostData?.id,
        postContent: mentionedPostData?.content,
        postAuthor: mentionedPostData?.author,
        postCreatedAt: mentionedPostData?.createdAt,
        postMedia: mentionedPostData?.media,
      });
      return;
    }

    // 返信検出 - 複数の形式をサポート
    let isReply = false;
    let replyToPostId: string | null = null;
    
    // 1. NIP-10形式: eタグに'reply'マーカーがある場合
    const replyTags = event.tags.filter(tag => 
      tag[0] === 'e' && tag[3] === 'reply'
    );
    
    if (replyTags.length > 0) {
      isReply = true;
      replyToPostId = replyTags[0][1];
    }
    
    // 2. eタグとpタグの組み合わせで判定（レガシー形式）
    if (!isReply) {
      const eTags = event.tags.filter(tag => tag[0] === 'e');
      const pTags = event.tags.filter(tag => tag[0] === 'p' && tag[1] === this.userPubkey);
      
      // eタグがあり、かつ自分宛のpタグがある場合は返信とみなす
      if (eTags.length > 0 && pTags.length > 0) {
        isReply = true;
        // 最後のeタグが返信先（NIP-10準拠）
        replyToPostId = eTags[eTags.length - 1][1];
      }
    }
    
    // 3. 返信を作成（自分の投稿への返信かどうかを確認）
    if (isReply && replyToPostId) {
      // 自分の投稿への返信かチェック
      const postData = await fetchPostData(replyToPostId);
      if (postData && postData.author.pubkey === this.userPubkey) {
        await this.createNotification({
          type: 'reply',
          event,
          content: event.content,
          postId: replyToPostId,
          postContent: postData.content,
          postAuthor: postData.author,
          postCreatedAt: postData.createdAt,
          postMedia: postData.media,
        });
        return; // 返信として処理したら終了
      }
    }
  }

  private async processContactList(event: NostrEvent) {
    if (!this.userPubkey) return;

    // 著者の既存状態を取得
    const author = event.pubkey;
    const prev = this.contactState.get(author);
    const currCreatedAt = event.created_at || 0;

    // 既存があり、受信したイベントが古ければ無視
    if (prev && prev.created_at >= currCreatedAt) {
      return;
    }

    // 現在のpタグ集合を作成
    const currentContacts = new Set<string>(
      event.tags.filter(t => t[0] === 'p' && t[1]).map(t => t[1] as string)
    );

    // 通知判断: 過去のkind3が存在する場合のみ差分（追加分）を評価
    let shouldNotify = false;
    if (prev) {
      // 差分: 追加された公開鍵
      let addedMyPubkey = false;
      if (this.userPubkey) {
        // 自分のpubkeyが新規に追加されたか
        addedMyPubkey = !prev.contacts.has(this.userPubkey) && currentContacts.has(this.userPubkey);
      }
      shouldNotify = addedMyPubkey;
    }

    // 状態を更新（常に最新を保存）
    this.contactState.set(author, { created_at: currCreatedAt, contacts: currentContacts });

    if (shouldNotify) {
      await this.createNotification({
        type: 'follow',
        event,
      });
    }
  }

  private async processRepost(event: NostrEvent) {
    if (!this.userPubkey) return;

    // リポストされた投稿のIDを取得
    const eTags = event.tags.filter(tag => tag[0] === 'e');
    const pTags = event.tags.filter(tag => 
      tag[0] === 'p' && tag[1] === this.userPubkey
    );
    
    if (pTags.length > 0 && eTags.length > 0) {
      const postId = eTags[0][1];
      
      // 元の投稿データを取得
      const postData = await fetchPostData(postId);
      
      await this.createNotification({
        type: 'repost',
        event,
        postId,
        postContent: postData?.content,
        postAuthor: postData?.author,
        postCreatedAt: postData?.createdAt,
        postMedia: postData?.media,
      });
    }
  }

  private async processReaction(event: NostrEvent) {
    if (!this.userPubkey) return;

    // いいね検出（+リアクション）
    if (event.content === '+' || event.content === '👍') {
      const pTags = event.tags.filter(tag => 
        tag[0] === 'p' && tag[1] === this.userPubkey
      );
      
      if (pTags.length > 0) {
        const eTags = event.tags.filter(tag => tag[0] === 'e');
        await this.createNotification({
          type: 'like',
          event,
          postId: eTags[0]?.[1],
        });
      }
    }
  }

  private async processZap(event: NostrEvent) {
    if (!this.userPubkey) return;

    try {
      // NIP-57 Zap Receipt の基本検証
      // 必須: description(tag)、bolt11(tag) が一般的
      const descriptionTag = event.tags.find(t => t[0] === 'description');
      if (!descriptionTag || !descriptionTag[1]) return; // 不正フォーマット

      // description には元の Zap Request (kind 9734) のイベント JSON が入っている想定
      let zapRequestEvent: any;
      try {
        zapRequestEvent = JSON.parse(descriptionTag[1]);
      } catch (e) {
        console.warn('[zap] invalid description JSON');
        return;
      }

      if (zapRequestEvent.kind !== 9734) {
        // 期待する kind ではない（他クライアントの拡張など）
        return;
      }

      const requestTags: string[][] = Array.isArray(zapRequestEvent.tags) ? zapRequestEvent.tags : [];

      // 受信者判定: zap request 内の p タグに自分の pubkey が含まれているか
      const recipientTag = requestTags.find(t => t[0] === 'p' && t[1] === this.userPubkey);
      if (!recipientTag) return; // 自分宛てでない

      // 対象ノート取得 (eタグ) - あれば通知に関連付け
      const noteTag = requestTags.find(t => t[0] === 'e' && t[1]);
      const targetNoteId = noteTag ? noteTag[1] : undefined;

      // 金額推定
      // 優先: zap receipt の bolt11 インボイスから抽出（簡易: 金額表記を正規表現で拾う）
      let amountSats: number | null = null;
      const bolt11Tag = event.tags.find(t => t[0] === 'bolt11');
      if (bolt11Tag && bolt11Tag[1]) {
        const invoice = bolt11Tag[1];
        // lnbc<amount><multiplier>... 形式を単純抽出（m=0.001 BTC, u=1e-6 BTC, n=1e-9 BTC, p=1e-12 BTC）
        // sats 換算するため、金額部をパース（厳密な BOLT11 解析ライブラリ未導入のため簡易実装）
        const m = invoice.match(/lnbc(\d+)([munp]?)/i);
        if (m) {
          const raw = parseInt(m[1]);
          const unit = m[2];
          // BTC -> sats 変換: 1 BTC = 100_000_000 sats
          const unitMultiplier: Record<string, number> = {
            '': 100_000_000, // no unit means BTC
            m: 100_000,      // milli-BTC
            u: 100,          // micro-BTC
            n: 0.1,          // nano-BTC
            p: 0.0001,       // pico-BTC
          };
          const btcToSats = unitMultiplier[unit] ?? 100_000_000;
          const sats = raw * btcToSats;
          if (sats > 0) amountSats = Math.floor(sats);
        }
      }

      // フォールバック: zap request 内の amount (msats) タグ
      if (amountSats == null) {
        const amountTag = requestTags.find(t => t[0] === 'amount' && t[1]);
        if (amountTag) {
          const msats = parseInt(amountTag[1]);
          if (!isNaN(msats) && msats > 0) amountSats = Math.floor(msats / 1000);
        }
      }

      if (amountSats == null) {
        const receiptAmountTag = event.tags.find(t => t[0] === 'amount' && t[1]);
        if (receiptAmountTag) {
          const msats = parseInt(receiptAmountTag[1]);
          if (!isNaN(msats) && msats > 0) amountSats = Math.floor(msats / 1000);
        }
      }

      // さらにフォールバック: 不明な場合は 0 扱い
      if (amountSats == null) amountSats = 0;

      // メッセージ: zap request の content
      const zapMessage: string | undefined = typeof zapRequestEvent.content === 'string' ? zapRequestEvent.content : undefined;

      // 関連ノートのメタデータ
      let postData = null;
      if (targetNoteId) {
        try {
          postData = await fetchPostData(targetNoteId);
        } catch (e) {
          // 失敗しても無視
        }
      }

      const zapperPubkey: string | undefined = typeof zapRequestEvent.pubkey === 'string' ? zapRequestEvent.pubkey : undefined;
      let zapperProfile: NotificationUser | undefined;
      if (zapperPubkey) {
        try {
          zapperProfile = await fetchProfileForNotification(zapperPubkey);
        } catch (profileError) {
          console.warn('[zap] failed to fetch zapper profile', profileError);
        }
      }

      await this.createNotification({
        type: 'zap',
        event,
        amount: amountSats,
        content: zapMessage,
        postId: postData?.id,
        postContent: postData?.content,
        postAuthor: postData?.author,
        postCreatedAt: postData?.createdAt,
        postMedia: postData?.media,
        userOverride: zapperProfile,
      });
    } catch (error) {
      console.error('Error processing zap event:', error);
    }
  }

  private async createNotification({
    type,
    event,
    content,
    postId,
    postContent,
    postAuthor,
    postCreatedAt,
    postMedia,
    amount,
    userOverride,
  }: {
    type: NotificationType;
    event: NostrEvent;
    content?: string;
    postId?: string;
    postContent?: string;
    postAuthor?: {
      id?: string;
      name?: string;
      username?: string;
      avatar?: string;
      npub?: string;
    };
    postCreatedAt?: Date;
    postMedia?: Array<{
      type: 'image' | 'video' | 'gif';
      url: string;
      thumbnailUrl?: string;
      altText?: string;
    }>;
    amount?: number;
    userOverride?: NotificationUser;
  }) {
    // プロフィール情報を取得
    const user = userOverride ?? await fetchProfileForNotification(event.pubkey);
    
    const notification: Notification = {
      id: `${event.id}-${type}`,
      type,
      user,
      content,
      postId,
      postContent,
      postAuthor,
      postCreatedAt,
      postMedia,
      amount,
      isRead: false,
      createdAt: new Date(event.created_at * 1000),
    };

    useNotificationStore.getState().addNotification(notification);
  }
}

export const nostrNotificationService = new NostrNotificationService();
