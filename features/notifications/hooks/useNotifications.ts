import { useEffect, useRef, useState } from 'react';
import { useNotificationStore } from '../../../stores/notification.store';
import { useAuthStore } from '../../../stores/auth.store';
import { nostrNotificationService } from '../services/nostr-notification';
import { subscribe } from '../../../lib/nostr/client';
import { subscribeTo } from '../../relays/services/relayPool';
import { useRelaysStore } from '../../../stores/relays.store';
import type { Filter, Event as NostrEvent } from 'nostr-tools';
import { KIND_TEXT_NOTE } from '../../../lib/nostr/constants';

export function useNotifications() {
  const { npub, publicKey } = useAuthStore();
  const { addNotification, clearNotifications } = useNotificationStore();
  const subscriptionRef = useRef<any>(null);
  const [userPostIds, setUserPostIds] = useState<string[]>([]);

  // ユーザーの投稿IDを取得
  useEffect(() => {
    if (!publicKey) return;

    const relays = useRelaysStore.getState().relays
      .filter(r => r.read)
      .map(r => r.url);

    if (relays.length === 0) return;

    const postIds: string[] = [];
    let timeoutId: NodeJS.Timeout;

    // ユーザーの投稿を取得（最近100件）
    const sub = subscribeTo(
      relays,
      [{
        kinds: [KIND_TEXT_NOTE],
        authors: [publicKey],
        limit: 100,
        since: Math.floor(Date.now() / 1000) - 86400 * 30, // 過去30日間
      }],
      (event: NostrEvent) => {
        postIds.push(event.id);
      }
    );

    // 3秒後に購読を終了
    timeoutId = setTimeout(() => {
      sub.close();
      setUserPostIds(postIds);
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
      sub.close();
    };
  }, [publicKey]);

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
      }
    ];

    // ユーザーの投稿への返信を取得するフィルターを追加
    if (userPostIds.length > 0) {
      filters.push({
        kinds: [1], // テキストノート（返信）
        '#e': userPostIds, // ユーザーの投稿IDへの参照
        since: Math.floor(Date.now() / 1000) - 86400 * 7, // 過去7日間
      });
    }

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
  }, [publicKey, userPostIds]);

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