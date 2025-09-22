import { subscribe } from '../../../lib/nostr/client';
import { useRelaysStore } from '../../../stores/relays.store';
import { KIND_TEXT_NOTE } from '../../../lib/nostr/constants';
import type { Event as NostrEvent } from 'nostr-tools';

// 投稿キャッシュ
const postCache = new Map<string, string>();
const pendingRequests = new Map<string, Promise<string | null>>();

/**
 * 投稿内容を取得
 */
export async function fetchPostContent(postId: string): Promise<string | null> {
  // キャッシュチェック
  if (postCache.has(postId)) {
    return postCache.get(postId)!;
  }

  // 既にリクエスト中の場合は待機
  if (pendingRequests.has(postId)) {
    return pendingRequests.get(postId)!;
  }

  // 投稿取得のPromiseを作成
  const promise = fetchPostFromNostr(postId);
  pendingRequests.set(postId, promise);

  try {
    const content = await promise;
    if (content) {
      postCache.set(postId, content);
    }
    return content;
  } finally {
    pendingRequests.delete(postId);
  }
}

/**
 * Nostrから投稿内容を取得
 */
async function fetchPostFromNostr(postId: string): Promise<string | null> {
  try {
    // リレーを取得
    const relaysStore = useRelaysStore.getState();
    const relays = relaysStore.relays
      .filter(r => r.read)
      .map(r => r.url);

    if (relays.length === 0) {
      return null;
    }

    return new Promise((resolve) => {
      let resolved = false;
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          sub.close();
          resolve(null);
        }
      }, 2000); // 2秒でタイムアウト

      const sub = subscribe(
        relays,
        [{ kinds: [KIND_TEXT_NOTE], ids: [postId], limit: 1 }],
        (event: NostrEvent) => {
          if (resolved) return;

          resolved = true;
          clearTimeout(timeoutId);
          sub.close();
          
          // 最初の50文字を返す
          const content = event.content.length > 50 
            ? event.content.substring(0, 50) + '...'
            : event.content;
          
          resolve(content);
        }
      );
    });
  } catch (error) {
    console.error('Failed to fetch post:', error);
    return null;
  }
}

/**
 * キャッシュをクリア
 */
export function clearPostCache() {
  postCache.clear();
  pendingRequests.clear();
}