import { type Event as NostrEvent } from 'nostr-tools';
import { subscribeTo, getReadRelays } from '../../relays/services/relayPool';
import { useRelaysStore } from '../../../stores/relays.store';
import { useAuthStore } from '../../../stores/auth.store';
import { KIND_FOLLOW, KIND_PEOPLE_LIST } from '../../../lib/nostr/constants';

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
      let latestEvent: NostrEvent | null = null;
      let timeoutId: NodeJS.Timeout;

      // フォローリスト候補（NIP-51 People List と NIP-02 Contact List）を購読し、最も新しいものを採用
      const sub = subscribeTo(
        relays,
        [
          { kinds: [KIND_PEOPLE_LIST, KIND_FOLLOW], authors: [targetPubkey], limit: 2 }
        ],
        (event: NostrEvent) => {
          try {
            // 最新の created_at を持つイベントを保持
            if (!latestEvent || event.created_at >= latestEvent.created_at) {
              latestEvent = event;
            }
          } catch (error) {
            console.error('[fetchFollowList] Failed to handle event:', error);
          }
        }
      );

      // タイムアウト設定（2秒）で購読を終了し、最新イベントからpタグを抽出
      timeoutId = setTimeout(() => {
        sub.close();
        if (latestEvent) {
          const tags = latestEvent.tags || [];
          followList = tags.filter(tag => tag[0] === 'p' && tag[1]).map(tag => tag[1]);
          console.log('[fetchFollowList] Selected follow list from kind', latestEvent.kind, 'size:', followList.length);
        } else {
          console.log('Follow list fetch timeout, no events received');
        }
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

      // 複数ユーザーの People/Contact List を購読し、各pubkeyごとに最新イベントを採用
      const latestEventByAuthor = new Map<string, NostrEvent>();
      const sub = subscribeTo(
        relays,
        [{
          kinds: [KIND_PEOPLE_LIST, KIND_FOLLOW],
          authors: pubkeys,
          limit: Math.max(2, pubkeys.length * 2)
        }],
        (event: NostrEvent) => {
          try {
            const prev = latestEventByAuthor.get(event.pubkey);
            if (!prev || event.created_at >= prev.created_at) {
              latestEventByAuthor.set(event.pubkey, event);
            }
          } catch (error) {
            console.error('Failed to handle follow list event:', error);
          }
        }
      );

      // タイムアウト設定（3秒）: 収集した最新イベントからpタグを抽出して返す
      timeoutId = setTimeout(() => {
        sub.close();
        for (const [author, ev] of latestEventByAuthor.entries()) {
          const tags = ev.tags || [];
          const followList = tags.filter(tag => tag[0] === 'p' && tag[1]).map(tag => tag[1]);
          followListMap.set(author, followList);
        }
        console.log(`Follow lists fetch timeout, got ${followListMap.size}/${pubkeys.length} lists (latest kinds per author)`);
        resolve(followListMap);
      }, 3000);
    });
  } catch (error) {
    console.error('Failed to fetch follow lists:', error);
    return new Map();
  }
}