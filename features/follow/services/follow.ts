import { type Event as NostrEvent } from 'nostr-tools';
import { subscribeTo, getReadRelays } from '../../relays/services/relayPool';
import { useRelaysStore } from '../../../stores/relays.store';
import { useAuthStore } from '../../../stores/auth.store';
import { useFollowCacheStore } from '../../../stores/follow-cache.store';
import { KIND_FOLLOW, KIND_PEOPLE_LIST } from '../../../lib/nostr/constants';

/**
 * ユーザーのフォローリスト（kind3イベント）を取得
 * KIND 3 (Contact List) を優先、KIND 30000 (People List) はフォールバック
 * キャッシュ対応、計測ログ、onEoseハンドラ付き
 */
export async function fetchFollowList(pubkey?: string): Promise<string[]> {
  const startTime = Date.now();

  try {
    // 公開鍵を取得（指定されていなければ現在のユーザー）
    const targetPubkey = pubkey || useAuthStore.getState().publicKey;

    if (!targetPubkey) {
      return [];
    }

    // キャッシュをチェック
    const cached = useFollowCacheStore.getState().getFollowList(targetPubkey);
    if (cached) {
      const elapsed = Date.now() - startTime;
      return cached.followList;
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
      let kind3Event: NostrEvent | null = null; // KIND_FOLLOW (3) 優先
      let kind30000Event: NostrEvent | null = null; // KIND_PEOPLE_LIST (30000) フォールバック
      let timeoutId: NodeJS.Timeout;
      let eventsReceived = 0;
      // フォローリスト候補を購読：KIND 3 を優先、KIND 30000 はフォールバック
      const sub = subscribeTo(
        relays,
        [
          { kinds: [KIND_FOLLOW, KIND_PEOPLE_LIST], authors: [targetPubkey], limit: 2 }
        ],
        (event: NostrEvent) => {
          try {
            eventsReceived++;

            if (event.kind === KIND_FOLLOW) {
              // KIND 3 は常に優先（最新のもの）
              if (!kind3Event || event.created_at >= kind3Event.created_at) {
                kind3Event = event;
              }
            } else if (event.kind === KIND_PEOPLE_LIST) {
              // KIND 30000 はフォールバック用
              if (!kind30000Event || event.created_at >= kind30000Event.created_at) {
                kind30000Event = event;
              }
            }
          } catch (error) {
          }
        },
        {
          onEose: () => {
            // EOSE を受信したらタイムアウトを待たずに早期終了
            clearTimeout(timeoutId);
            sub.close();
            finalizeAndResolve();
          }
        }
      );

      const finalizeAndResolve = () => {
        const elapsed = Date.now() - startTime;
        let followList: string[] = [];
        let selectedKind: number | null = null;

        // KIND 3 を優先、なければ KIND 30000 を使用
        const selectedEvent = kind3Event || kind30000Event;

        if (selectedEvent) {
          const tags = selectedEvent.tags || [];
          followList = tags.filter(tag => tag[0] === 'p' && tag[1]).map(tag => tag[1]);
          selectedKind = selectedEvent.kind;

          // キャッシュに保存
          useFollowCacheStore.getState().setFollowList(targetPubkey, followList, selectedKind);

        } else {
        }

        resolve(followList);
      };

      // タイムアウト設定（3.5秒）で購読を終了
      timeoutId = setTimeout(() => {
        sub.close();
        finalizeAndResolve();
      }, 3500);
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;

    // エラー時もキャッシュがあれば返す
    if (pubkey || useAuthStore.getState().publicKey) {
      const targetPubkey = pubkey || useAuthStore.getState().publicKey!;
      const cached = useFollowCacheStore.getState().getFollowList(targetPubkey);
      if (cached) {
        return cached.followList;
      }
    }

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
        resolve(followListMap);
      }, 3000);
    });
  } catch (error) {
    return new Map();
  }
}