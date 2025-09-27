/**
 * AES-GCM暗号化実装
 * セキュリティ: 実際の暗号化を行います
 */

// Web Crypto APIを使用した安全な暗号化
export async function encrypt(plaintext: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  // パスワードから暗号化キーを派生
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  // salt + iv + encrypted を base64 で結合
  const result = {
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(encrypted)))
  };
  
  return btoa(JSON.stringify(result));
}

export async function decrypt(encryptedData: string, password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const parsed = JSON.parse(atob(encryptedData));
    const salt = new Uint8Array(atob(parsed.salt).split('').map(c => c.charCodeAt(0)));
    const iv = new Uint8Array(atob(parsed.iv).split('').map(c => c.charCodeAt(0)));
    const data = new Uint8Array(atob(parsed.data).split('').map(c => c.charCodeAt(0)));
    
    // パスワードから復号化キーを派生
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('[decrypt] Decryption failed:', error);
    throw new Error('Decryption failed - invalid password or corrupted data');
  }
}
