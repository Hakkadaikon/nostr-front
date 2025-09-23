import { Event as NostrEvent } from 'nostr-tools';
import { useNotificationStore } from '../../../stores/notification.store';
import { Notification, NotificationType } from '../../../types/notification';
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
      await this.createNotification({
        type: 'mention',
        event,
        content: event.content,
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
      // Zap receiptイベント (kind 9735) の処理
      // descriptionタグから元のZap requestを取得
      const descriptionTag = event.tags.find(tag => tag[0] === 'description');
      if (!descriptionTag || !descriptionTag[1]) return;

      let zapRequest: any;
      try {
        zapRequest = JSON.parse(descriptionTag[1]);
      } catch (error) {
        console.error('Failed to parse zap request:', error);
        return;
      }

      // Zap requestから受信者を確認
      const recipientTag = zapRequest.tags?.find((tag: string[]) => 
        tag[0] === 'p' && tag[1] === this.userPubkey
      );
      if (!recipientTag) return;

      // 金額を取得 (millisatoshis)
      const amountTag = zapRequest.tags?.find((tag: string[]) => tag[0] === 'amount');
      let amountSats = 1000; // デフォルト値
      
      if (amountTag && amountTag[1]) {
        const amountMilliSats = parseInt(amountTag[1]);
        amountSats = Math.floor(amountMilliSats / 1000); // millisatsからsatsに変換
      }

      // bolt11タグから実際の支払い金額を確認（より正確）
      const bolt11Tag = event.tags.find(tag => tag[0] === 'bolt11');
      if (bolt11Tag && bolt11Tag[1]) {
        // Lightning invoiceから金額を抽出する場合はここで処理
        // 現在は簡略化のためzap requestの金額を使用
      }

      // Zapメッセージを取得
      const zapMessage = zapRequest.content || '';

      await this.createNotification({
        type: 'zap',
        event,
        amount: amountSats,
        content: zapMessage,
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
  }) {
    // プロフィール情報を取得
    const user = await fetchProfileForNotification(event.pubkey);
    
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