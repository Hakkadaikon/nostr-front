import { type Event as NostrEvent } from 'nostr-tools';
import { subscribeTo, getReadRelays } from '../../relays/services/relayPool';
import { useRelaysStore } from '../../../stores/relays.store';
import { useAuthStore } from '../../../stores/auth.store';
import { KIND_FOLLOW } from '../../../lib/nostr/constants';

/**
 * ユーザーのフォローリスト（kind3イベント）を取得
 */
export async function fetchFollowList(pubkey?: string): Promise<string[]> {
  try {
    // 公開鍵を取得（指定されていなければ現在のユーザー）
    const targetPubkey = pubkey || useAuthStore.getState().publicKey;
    console.log('[fetchFollowList] Target pubkey:', targetPubkey);
    
    if (!targetPubkey) {
      console.error('[fetchFollowList] No public key available');
      return [];
    }

    // リレー設定を取得
    const relaysStore = useRelaysStore.getState();
    let relays = getReadRelays(relaysStore.relays);
    
    if (relays.length === 0) {
      // 環境変数からデフォルトリレーを取得
      const defaultRelays = process.env.NEXT_PUBLIC_DEFAULT_RELAYS;
      if (defaultRelays) {
        relays = defaultRelays.split(',').map(url => url.trim());
      } else {
        // フォールバック用のデフォルトリレー
        relays = [
          'wss://relay.damus.io',
          'wss://nos.lol',
          'wss://relay.nostr.band'
        ];
      }
    }

    return new Promise((resolve) => {
      let followList: string[] = [];
      let timeoutId: NodeJS.Timeout;

      // kind3イベントを購読
      const sub = subscribeTo(
        relays,
        [{
          kinds: [KIND_FOLLOW],
          authors: [targetPubkey],
          limit: 1
        }],
        (event: NostrEvent) => {
          try {
            console.log('[fetchFollowList] Received kind3 event:', event);
            
            // タグからフォローしている公開鍵を抽出
            followList = event.tags
              .filter(tag => tag[0] === 'p' && tag[1])
              .map(tag => tag[1]);
            
            console.log('[fetchFollowList] Extracted follow list:', followList.length, 'pubkeys');
            
            clearTimeout(timeoutId);
            sub.close();
            resolve(followList);
          } catch (error) {
            console.error('[fetchFollowList] Failed to parse follow list:', error);
          }
        }
      );

      // タイムアウト設定（2秒）
      timeoutId = setTimeout(() => {
        sub.close();
        console.log('Follow list fetch timeout, returning empty list');
        resolve(followList);
      }, 2000);
    });
  } catch (error) {
    console.error('Failed to fetch follow list:', error);
    return [];
  }
}

/**
 * 複数のフォローリストを一括取得（効率化のため）
 */
export async function fetchFollowLists(pubkeys: string[]): Promise<Map<string, string[]>> {
  try {
    if (pubkeys.length === 0) return new Map();

    // リレー設定を取得
    const relaysStore = useRelaysStore.getState();
    let relays = getReadRelays(relaysStore.relays);
    
    if (relays.length === 0) {
      // 環境変数からデフォルトリレーを取得
      const defaultRelays = process.env.NEXT_PUBLIC_DEFAULT_RELAYS;
      if (defaultRelays) {
        relays = defaultRelays.split(',').map(url => url.trim());
      } else {
        // フォールバック用のデフォルトリレー
        relays = [
          'wss://relay.damus.io',
          'wss://nos.lol',
          'wss://relay.nostr.band'
        ];
      }
    }

    return new Promise((resolve) => {
      const followListMap = new Map<string, string[]>();
      let timeoutId: NodeJS.Timeout;

      // 複数のkind3イベントを購読
      const sub = subscribeTo(
        relays,
        [{
          kinds: [KIND_FOLLOW],
          authors: pubkeys,
          limit: pubkeys.length
        }],
        (event: NostrEvent) => {
          try {
            // タグからフォローしている公開鍵を抽出
            const followList = event.tags
              .filter(tag => tag[0] === 'p' && tag[1])
              .map(tag => tag[1]);
            
            followListMap.set(event.pubkey, followList);

            // 全ユーザーのフォローリストを取得したら完了
            if (followListMap.size === pubkeys.length) {
              clearTimeout(timeoutId);
              sub.close();
              resolve(followListMap);
            }
          } catch (error) {
            console.error('Failed to parse follow list:', error);
          }
        }
      );

      // タイムアウト設定（3秒）
      timeoutId = setTimeout(() => {
        sub.close();
        console.log(`Follow lists fetch timeout, got ${followListMap.size}/${pubkeys.length} lists`);
        resolve(followListMap);
      }, 3000);
    });
  } catch (error) {
    console.error('Failed to fetch follow lists:', error);
    return new Map();
  }
}