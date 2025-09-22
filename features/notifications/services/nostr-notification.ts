import { Event as NostrEvent } from 'nostr-tools';
import { useNotificationStore } from '../../../stores/notification.store';
import { Notification, NotificationType } from '../../../types/notification';
import { fetchProfileForNotification } from '../../profile/services/profile-cache';

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

    // 返信検出
    const replyTags = event.tags.filter(tag => 
      tag[0] === 'e' && tag[3] === 'reply'
    );
    
    if (replyTags.length > 0) {
      // この投稿が自分の投稿への返信かチェックする必要がある
      // ここでは簡略化のため、pタグで自分がタグ付けされているかチェック
      const pTags = event.tags.filter(tag => 
        tag[0] === 'p' && tag[1] === this.userPubkey
      );
      
      if (pTags.length > 0) {
        await this.createNotification({
          type: 'reply',
          event,
          content: event.content,
        });
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

    // 差分を計算: 新しく追加された公開鍵のみ
    const containsMeNow = this.userPubkey ? currentContacts.has(this.userPubkey) : false;

    // 通知判定
    let shouldNotify = false;
    if (!prev) {
      // 初回受信: 現在のリストに自分が含まれていれば「新規フォロー」とみなす
      shouldNotify = containsMeNow;
    } else {
      // 以前は含まれておらず、今回含まれた場合のみ通知
      if (this.userPubkey && !prev.contacts.has(this.userPubkey) && containsMeNow) {
        shouldNotify = true;
      }
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
      await this.createNotification({
        type: 'repost',
        event,
        postId: eTags[0][1],
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

    // Zapイベントの処理（簡略化）
    const pTags = event.tags.filter(tag => 
      tag[0] === 'p' && tag[1] === this.userPubkey
    );
    
    if (pTags.length > 0) {
      // 金額の抽出（実際のZapイベントではより複雑な処理が必要）
      const amountTag = event.tags.find(tag => tag[0] === 'amount');
      const amount = amountTag ? parseInt(amountTag[1]) : 1000;
      
      await this.createNotification({
        type: 'zap',
        event,
        amount,
      });
    }
  }

  private async createNotification({
    type,
    event,
    content,
    postId,
    postContent,
    amount,
  }: {
    type: NotificationType;
    event: NostrEvent;
    content?: string;
    postId?: string;
    postContent?: string;
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
      amount,
      isRead: false,
      createdAt: new Date(event.created_at * 1000),
    };

    useNotificationStore.getState().addNotification(notification);
  }
}

export const nostrNotificationService = new NostrNotificationService();