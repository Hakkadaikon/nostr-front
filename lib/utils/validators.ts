import { nip19 } from 'nostr-tools';

const HEX_RE = /^[0-9a-f]+$/i;

export function isHex(input: string, len?: number) {
  return HEX_RE.test(input) && (len ? input.length === len : true);
}

export function isNostrBech32(input: string) {
  try { nip19.decode(input); return true; } catch { return false; }
}

export function isNostrUri(input: string) {
  if (!input?.startsWith('nostr:')) return false;
  const bech = input.slice(6);
  return isNostrBech32(bech);
}

export function isSafeHttpUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
