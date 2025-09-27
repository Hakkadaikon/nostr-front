/**
 * セキュアなキー導出関数（PBKDF2実装）
 */
export async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  
  // パスワードをキーマテリアルとしてインポート
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // saltをUint8Arrayに変換
  const saltBytes = encoder.encode(salt);
  
  // PBKDF2でキーを導出
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000, // セキュリティのため高い反復回数
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * ランダムソルトを生成
 */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...salt));
}
