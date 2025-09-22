import { type Event as NostrEvent, nip19 } from 'nostr-tools';
import { publish } from '../../../lib/nostr/client';
import { useRelaysStore } from '../../../stores/relays.store';
import { KIND_REPOST, KIND_TEXT_NOTE } from '../../../lib/nostr/constants';

/**
 * 投稿をリポストする
 */
export async function createRepost(targetEventId: string, targetPubkey: string): Promise<void> {
  try {
    console.log('[createRepost] Creating repost for event:', targetEventId);
    
    // リレーの設定を取得
    let relays = useRelaysStore.getState().relays.filter(r => r.write).map(r => r.url);
    if (relays.length === 0) {
      const defaultRelays = process.env.NEXT_PUBLIC_DEFAULT_RELAYS;
      if (defaultRelays) {
        relays = defaultRelays.split(',').map(url => url.trim());
      } else {
        relays = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.nostr.band'];
      }
    }
    
    // リポストイベントを作成
    const unsignedEvent = {
      kind: KIND_REPOST,
      content: '', // kind6は通常contentが空
      tags: [
        ['e', targetEventId, '', 'mention'],
        ['p', targetPubkey]
      ],
      created_at: Math.floor(Date.now() / 1000),
      pubkey: '', // これは署名時に設定される
    };
    
    // Nip07で署名
    if (window.nostr) {
      const signedEvent = await window.nostr.signEvent(unsignedEvent);
      await publish(relays, signedEvent as NostrEvent);
      console.log('[createRepost] Successfully created repost');
    } else {
      throw new Error('Nostr extension not found');
    }
  } catch (error) {
    console.error('[createRepost] Failed to create repost:', error);
    throw error;
  }
}

/**
 * リポストを削除する（削除イベントを送信）
 * 注意: Nostrでは実際にはイベントを削除できないので、削除リクエストを送信するだけ
 */
export async function deleteRepost(repostEventId: string): Promise<void> {
  try {
    console.log('[deleteRepost] Creating delete event for repost:', repostEventId);
    
    // リレーの設定を取得
    let relays = useRelaysStore.getState().relays.filter(r => r.write).map(r => r.url);
    if (relays.length === 0) {
      const defaultRelays = process.env.NEXT_PUBLIC_DEFAULT_RELAYS;
      if (defaultRelays) {
        relays = defaultRelays.split(',').map(url => url.trim());
      } else {
        relays = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.nostr.band'];
      }
    }
    
    // 削除イベントを作成（kind 5）
    const unsignedEvent = {
      kind: 5, // 削除イベント
      content: '',
      tags: [
        ['e', repostEventId]
      ],
      created_at: Math.floor(Date.now() / 1000),
      pubkey: '', // これは署名時に設定される
    };
    
    // Nip07で署名
    if (window.nostr) {
      const signedEvent = await window.nostr.signEvent(unsignedEvent);
      await publish(relays, signedEvent as NostrEvent);
      console.log('[deleteRepost] Successfully sent delete request');
    } else {
      throw new Error('Nostr extension not found');
    }
  } catch (error) {
    console.error('[deleteRepost] Failed to delete repost:', error);
    throw error;
  }
}