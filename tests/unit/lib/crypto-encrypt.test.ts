import { describe, it, expect, beforeEach } from 'vitest';
import { encrypt, decrypt } from '../../../lib/crypto/encrypt';

describe('crypto/encrypt', () => {
  const plaintext = 'nsec1test123456789abcdef';
  const password = 'testPassword123';

  it('should encrypt and decrypt data successfully', async () => {
    const encrypted = await encrypt(plaintext, password);
    const decrypted = await decrypt(encrypted, password);
    
    expect(decrypted).toBe(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.length).toBeGreaterThan(plaintext.length);
  });

  it('should produce different encrypted outputs for same input', async () => {
    const encrypted1 = await encrypt(plaintext, password);
    const encrypted2 = await encrypt(plaintext, password);
    
    // 異なるIVとsaltにより、同じ入力でも異なる暗号化結果が得られる
    expect(encrypted1).not.toBe(encrypted2);
    
    // しかし、両方とも正しく復号化される
    const decrypted1 = await decrypt(encrypted1, password);
    const decrypted2 = await decrypt(encrypted2, password);
    
    expect(decrypted1).toBe(plaintext);
    expect(decrypted2).toBe(plaintext);
  });

  it('should fail decryption with wrong password', async () => {
    const encrypted = await encrypt(plaintext, password);
    
    await expect(decrypt(encrypted, 'wrongPassword')).rejects.toThrow(
      'Decryption failed - invalid password or corrupted data'
    );
  });

  it('should fail decryption with corrupted data', async () => {
    const encrypted = await encrypt(plaintext, password);
    const corrupted = encrypted.slice(0, -5) + 'xxxxx';
    
    await expect(decrypt(corrupted, password)).rejects.toThrow();
  });

  it('should handle empty strings', async () => {
    const encrypted = await encrypt('', password);
    const decrypted = await decrypt(encrypted, password);
    
    expect(decrypted).toBe('');
  });

  it('should handle unicode characters', async () => {
    const unicodeText = '🔐日本語のテスト🗝️';
    const encrypted = await encrypt(unicodeText, password);
    const decrypted = await decrypt(encrypted, password);
    
    expect(decrypted).toBe(unicodeText);
  });
});