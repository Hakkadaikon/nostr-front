import { subscribe } from '../../../lib/nostr/client';
import { useRelaysStore } from '../../../stores/relays.store';
import { KIND_TEXT_NOTE } from '../../../lib/nostr/constants';
import type { Event as NostrEvent } from 'nostr-tools';
import { fetchProfileForNotification } from '../../profile/services/profile-cache';

// 投稿データの型定義
export interface PostData {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    npub: string;
    pubkey?: string;
  };
  createdAt: Date;
  media?: Array<{
    type: 'image' | 'video' | 'gif';
    url: string;
    thumbnailUrl?: string;
    altText?: string;
  }>;
}

// 投稿キャッシュ
const postCache = new Map<string, string>();
const postDataCache = new Map<string, PostData>();
const pendingRequests = new Map<string, Promise<string | null>>();
const pendingDataRequests = new Map<string, Promise<PostData | null>>();

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
 * 完全な投稿データを取得
 * @param postId - 投稿ID
 * @param additionalRelays - 追加で検索するリレーURL配列（Zap receiptなどから取得したもの）
 */
export async function fetchPostData(postId: string, additionalRelays?: string[]): Promise<PostData | null> {
  // キャッシュチェック
  if (postDataCache.has(postId)) {
    return postDataCache.get(postId)!;
  }

  // 既にリクエスト中の場合は待機
  if (pendingDataRequests.has(postId)) {
    return pendingDataRequests.get(postId)!;
  }

  // 投稿取得のPromiseを作成
  const promise = fetchPostDataFromNostr(postId, additionalRelays);
  pendingDataRequests.set(postId, promise);

  try {
    const data = await promise;
    if (data) {
      postDataCache.set(postId, data);
    }
    return data;
  } finally {
    pendingDataRequests.delete(postId);
  }
}

/**
 * Nostrから完全な投稿データを取得
 * @param postId - 投稿ID
 * @param additionalRelays - 追加で検索するリレーURL配列
 */
async function fetchPostDataFromNostr(postId: string, additionalRelays?: string[]): Promise<PostData | null> {
  const startTime = Date.now();
  try {
    // リレーを取得
    const relaysStore = useRelaysStore.getState();
    const configuredRelays = relaysStore.relays
      .filter(r => r.read)
      .map(r => r.url);

    // 追加リレーとマージ（重複除去）
    const relays = Array.from(new Set([
      ...configuredRelays,
      ...(additionalRelays || [])
    ]));

    // フォールバック: デフォルトリレーを追加
    if (relays.length === 0) {
      const envRelays = (process.env.NEXT_PUBLIC_DEFAULT_RELAYS || '')
        .split(',')
        .map(u => u.trim())
        .filter(Boolean);

      const fallbackRelays = envRelays.length > 0 ? envRelays : [
        'wss://relay.damus.io',
        'wss://nos.lol',
        'wss://relay.nostr.band'
      ];

      relays.push(...fallbackRelays);
    }

    console.log(`[fetchPostData] Fetching post ${postId.slice(0, 8)}... from ${relays.length} relays`);

    return new Promise((resolve) => {
      let resolved = false;
      // Zap対象ノート取得のためタイムアウトを5秒に延長
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          sub.close();
          const elapsed = Date.now() - startTime;
          console.warn(`[fetchPostData] Timeout fetching post ${postId.slice(0, 8)}... after ${elapsed}ms`);
          resolve(null);
        }
      }, 5000);

      const sub = subscribe(
        relays,
        [{ kinds: [KIND_TEXT_NOTE], ids: [postId], limit: 1 }],
        async (event: NostrEvent) => {
          if (resolved) return;

          resolved = true;
          clearTimeout(timeoutId);
          sub.close();

          const elapsed = Date.now() - startTime;
          console.log(`[fetchPostData] Successfully fetched post ${postId.slice(0, 8)}... in ${elapsed}ms`);

          // 著者情報を取得
          const author = await fetchProfileForNotification(event.pubkey);

          // メディアURLを抽出
          const imageRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg))/gi;
          const videoRegex = /(https?:\/\/[^\s]+\.(mp4|webm|mov))/gi;
          const media: PostData['media'] = [];

          const imageMatches = event.content.match(imageRegex);
          if (imageMatches) {
            imageMatches.forEach(url => {
              media.push({
                type: url.toLowerCase().includes('.gif') ? 'gif' : 'image',
                url
              });
            });
          }

          const videoMatches = event.content.match(videoRegex);
          if (videoMatches) {
            videoMatches.forEach(url => {
              media.push({
                type: 'video',
                url
              });
            });
          }

          const postData: PostData = {
            id: event.id || postId,
            content: event.content,
            author,
            createdAt: new Date(event.created_at * 1000),
            media: media.length > 0 ? media : undefined
          };

          resolve(postData);
        }
      );
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[fetchPostData] Error fetching post data after ${elapsed}ms:`, error);
    return null;
  }
}

/**
 * キャッシュをクリア
 */
export function clearPostCache() {
  postCache.clear();
  postDataCache.clear();
  pendingRequests.clear();
  pendingDataRequests.clear();
}