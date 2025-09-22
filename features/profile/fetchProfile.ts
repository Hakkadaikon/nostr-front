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
      console.error('Failed to decode npub:', err);
      return {};
    }
  }
  
  const relays = require('../../stores/relays.store').useRelaysStore.getState().relays.filter((r: any) => r.read).map((r: any) => r.url);
  
  if (relays.length === 0) {
    console.warn('No relays configured for reading');
    return {};
  }
  
  return new Promise<any>((resolve) => {
    let hasResolved = false;
    const filters: Filter[] = [{ kinds: [0], authors: [authorHex], limit: 1 } as any];
    
    const sub = subscribe(relays, filters, (e) => {
      if (!hasResolved) {
        hasResolved = true;
        try { 
          const profile = JSON.parse(e.content);
          resolve(profile); 
        } catch { 
          resolve({}); 
        }
        sub.close();
      }
    });
    
    // タイムアウトを3秒に延長
    setTimeout(() => { 
      if (!hasResolved) {
        hasResolved = true;
        resolve({}); 
        sub.close(); 
      }
    }, 3000);
  });
}
