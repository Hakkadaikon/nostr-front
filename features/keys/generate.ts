import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';

function toHex(u8: Uint8Array) {
  return Array.from(u8).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generatePrivateKey() {
  const sk = generateSecretKey(); // Uint8Array
  const hex = toHex(sk);
  const pk = getPublicKey(sk);
  const npub = nip19.npubEncode(pk);
  const nsec = nip19.nsecEncode(sk);
  return { hex, npub, nsec };
}
