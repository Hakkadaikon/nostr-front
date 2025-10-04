import type { Filter } from 'nostr-tools';
import { subscribe } from '../../lib/nostr/client';
import { decode } from '../../lib/nostr/nip19';

export async function fetchProfile(npubOrHex: string) {
  // convert npub to hex if needed
  let authorHex = npubOrHex;
  if (npubOrHex.startsWith('npub1')) {
    try { 
      const d = decode(npubOrHex); 
      authorHex = d.data as string; 
    } catch (err) {
      return {};
    }
  }
  
  const relays = require('../../stores/relays.store').useRelaysStore.getState().relays.filter((r: any) => r.read).map((r: any) => r.url);
  
  if (relays.length === 0) {
    return {};
  }
  
  return new Promise<any>((resolve) => {
    let hasResolved = false;
    let latestEvent: any = null;
    let latestTimestamp = 0;

    const filters: Filter[] = [{ kinds: [0], authors: [authorHex], limit: 10 } as any]; // 複数取得

    const sub = subscribe(relays, filters, (e) => {
      if (!hasResolved) {
        // より新しいイベントかチェック
        if (!e.created_at || e.created_at > latestTimestamp) {
          latestEvent = e;
          latestTimestamp = e.created_at || 0;
        }
      }
    });

    // 1秒待って最新のイベントを処理
    setTimeout(() => {
      if (!hasResolved && latestEvent) {
        hasResolved = true;
        try {
          const profile = JSON.parse(latestEvent.content);
          resolve(profile);
        } catch {
          resolve({});
        }
        sub.close();
      }
    }, 1000);

    // タイムアウトを3秒に延長
    setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        if (latestEvent) {
          try {
            const profile = JSON.parse(latestEvent.content);
            resolve(profile);
          } catch {
            resolve({});
          }
        } else {
          resolve({});
        }
        sub.close();
      }
    }, 3000);
  });
}
