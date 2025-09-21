import { getStorage } from './index';

const ENC_VERSION = 1;

async function deriveKey(password: string, salt: Uint8Array) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function toB64(buf: ArrayBuffer) { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function fromB64(b64: string) { return Uint8Array.from(atob(b64), c => c.charCodeAt(0)); }

export async function saveSecret(key: string, value: string, password: string) {
  const storage = getStorage();
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const aesKey = await deriveKey(password, salt);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, enc.encode(value));
  const payload = { v: ENC_VERSION, iv: toB64(iv), s: toB64(salt), data: toB64(cipher) };
  await storage.setItem(key, payload);
}

export async function loadSecret(key: string, password: string) {
  const storage = getStorage();
  const payload = await storage.getItem<any>(key);
  if (!payload) return null;
  const { iv, s, data } = payload;
  const aesKey = await deriveKey(password, fromB64(s));
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, aesKey, fromB64(data));
  return new TextDecoder().decode(plain);
}

export async function removeSecret(key: string) {
  await getStorage().removeItem(key);
}
