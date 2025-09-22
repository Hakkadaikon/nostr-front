import { Event as NostrEvent, getPublicKey, getEventHash, signEvent } from 'nostr-tools';
import { KIND_REACTION, KIND_DELETE } from '../../../lib/nostr/constants';
import { getWriteRelays, getReadRelays, publishEvent, subscribeTo } from '../../relays/services/relayPool';
import { useRelaysStore } from '../../../stores/relays.store';
import { useAuthStore } from '../../../stores/auth.store';

/**
 * リアクション（いいね）を作成する
 * @param eventId - リアクション対象のイベントID
 * @param authorPubkey - リアクション対象のイベントの作者の公開鍵
 * @returns 作成されたリアクションイベント
 */
export async function createReaction(eventId: string, authorPubkey: string): Promise<NostrEvent> {
  const authStore = useAuthStore.getState();
  const { privateKey } = authStore;
  
  if (!privateKey) {
    throw new Error('Private key not found');
  }

  const pubkey = getPublicKey(privateKey);
  
  // リアクションイベントの作成
  const event: Omit<NostrEvent, 'id' | 'sig'> = {
    kind: KIND_REACTION,
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['e', eventId], // リアクション対象のイベント
      ['p', authorPubkey], // リアクション対象のイベントの作者
    ],
    content: '+' // Nostrでは「+」が「いいね」を表す
  };

  // イベントIDを生成
  const eventWithId = {
    ...event,
    id: getEventHash(event as NostrEvent)
  };

  // 署名
  const signedEvent = {
    ...eventWithId,
    sig: signEvent(eventWithId as NostrEvent, privateKey)
  } as NostrEvent;

  // リレーに送信
  const relaysStore = useRelaysStore.getState();
  const writeRelays = getWriteRelays(relaysStore.relays);
  
  await publishEvent(signedEvent, writeRelays);
  
  return signedEvent;
}

/**
 * リアクション（いいね）を削除する
 * @param reactionEventId - 削除するリアクションイベントのID
 * @returns 作成された削除イベント
 */
export async function deleteReaction(reactionEventId: string): Promise<NostrEvent> {
  const authStore = useAuthStore.getState();
  const { privateKey } = authStore;
  
  if (!privateKey) {
    throw new Error('Private key not found');
  }

  const pubkey = getPublicKey(privateKey);
  
  // 削除イベントの作成
  const event: Omit<NostrEvent, 'id' | 'sig'> = {
    kind: KIND_DELETE,
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['e', reactionEventId] // 削除対象のリアクションイベント
    ],
    content: '' // 削除イベントのcontentは空
  };

  // イベントIDを生成
  const eventWithId = {
    ...event,
    id: getEventHash(event as NostrEvent)
  };

  // 署名
  const signedEvent = {
    ...eventWithId,
    sig: signEvent(eventWithId as NostrEvent, privateKey)
  } as NostrEvent;

  // リレーに送信
  const relaysStore = useRelaysStore.getState();
  const writeRelays = getWriteRelays(relaysStore.relays);
  
  await publishEvent(signedEvent, writeRelays);
  
  return signedEvent;
}

/**
 * 特定のイベントに対する自分のリアクションを取得する
 * @param eventId - チェック対象のイベントID
 * @returns リアクションイベントまたはnull
 */
export async function getMyReaction(eventId: string): Promise<NostrEvent | null> {
  const authStore = useAuthStore.getState();
  const { publicKey } = authStore;
  
  if (!publicKey) {
    return null;
  }

  const relaysStore = useRelaysStore.getState();
  const readRelays = getReadRelays(relaysStore.relays);
  
  return new Promise((resolve) => {
    let reaction: NostrEvent | null = null;
    let timeoutId: NodeJS.Timeout;

    const sub = subscribeTo(
      readRelays,
      [{
        kinds: [KIND_REACTION],
        authors: [publicKey],
        '#e': [eventId],
        limit: 1
      }],
      (event: NostrEvent) => {
        // contentが'+'のリアクションのみを対象とする
        if (event.content === '+') {
          reaction = event;
          clearTimeout(timeoutId);
          sub.close();
          resolve(reaction);
        }
      }
    );

    // タイムアウト設定（1秒）
    timeoutId = setTimeout(() => {
      sub.close();
      resolve(null);
    }, 1000);
  });
}