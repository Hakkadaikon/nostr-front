import { useEffect, useRef } from 'react';
import { useNotificationStore } from '../../../stores/notification.store';
import { useAuthStore } from '../../../stores/auth.store';
import { nostrNotificationService } from '../services/nostr-notification';
import { subscribe } from '../../../lib/nostr/client';
import { useRelaysStore } from '../../../stores/relays.store';
import type { Filter } from 'nostr-tools';

export function useNotifications() {
  const { npub, publicKey } = useAuthStore();
  const { addNotification, clearNotifications } = useNotificationStore();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!publicKey) return;

    // 通知サービスにpubkeyを設定
    nostrNotificationService.setUserPubkey(publicKey);

    // リレーから通知を購読
    const relays = useRelaysStore.getState().relays
      .filter(r => r.read)
      .map(r => r.url);

    if (relays.length === 0) return;

    // フィルター設定
    const filters: Filter[] = [
      {
        kinds: [1, 3, 6, 7, 9735], // テキスト、フォロー、リポスト、リアクション、Zap
        '#p': [publicKey], // 自分宛のイベント
        since: Math.floor(Date.now() / 1000) - 86400 * 7, // 過去7日間
      },
      {
        kinds: [1], // テキストノートで自分の投稿への返信も取得
        '#e': [], // すべてのeタグを取得（後でフィルタリング）
        since: Math.floor(Date.now() / 1000) - 86400 * 7,
      }
    ];

    // 購読開始
    subscriptionRef.current = subscribe(relays, filters, async (event) => {
      await nostrNotificationService.processEvent(event);
    });

    // クリーンアップ
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.close();
        subscriptionRef.current = null;
      }
    };
  }, [publicKey]);

  return {
    npub,
    publicKey,
  };
}

export function useNotificationActions() {
  const { markAsRead, markAllAsRead, clearNotifications } = useNotificationStore();

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    if (confirm('すべての通知を削除してもよろしいですか？')) {
      clearNotifications();
    }
  };

  return {
    handleNotificationClick,
    handleMarkAllAsRead,
    handleClearAll,
  };
}