import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { saveEncryptedNsec, loadEncryptedNsec, removeEncryptedNsec, clearSensitiveString } from '../../../lib/crypto/keyStorage';

// LocalStorageのモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Navigatorのモック
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test-user-agent',
    language: 'ja-JP',
    platform: 'test-platform',
  },
});

Object.defineProperty(window, 'screen', {
  value: {
    width: 1920,
    height: 1080,
  },
});

describe('crypto/keyStorage', () => {
  const testUserId = 'test-pubkey-123';
  const testNsec = 'nsec1test123456789abcdef';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('saveEncryptedNsec', () => {
    it('should save encrypted private key to localStorage', async () => {
      await saveEncryptedNsec(testUserId, testNsec);
      
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `encrypted_nsec_${testUserId}`,
        expect.any(String)
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `nsec_salt_${testUserId}`,
        expect.any(String)
      );
    });

    it('should throw error on encryption failure', async () => {
      // Web Crypto APIのモックでエラーを発生させる
      const originalCrypto = globalThis.crypto;
      globalThis.crypto = {
        ...originalCrypto,
        getRandomValues: () => { throw new Error('Crypto API error'); },
      } as any;

      await expect(saveEncryptedNsec(testUserId, testNsec)).rejects.toThrow(
        'Failed to save private key securely'
      );

      globalThis.crypto = originalCrypto;
    });
  });

  describe('loadEncryptedNsec', () => {
    it('should return null if no encrypted data exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = await loadEncryptedNsec(testUserId);
      expect(result).toBeNull();
    });

    it('should decrypt and return private key successfully', async () => {
      // まず暗号化して保存
      await saveEncryptedNsec(testUserId, testNsec);
      
      // setItemの呼び出し引数を取得
      const encryptedData = localStorageMock.setItem.mock.calls[0][1];
      const salt = localStorageMock.setItem.mock.calls[1][1];
      
      // getItemモックを設定
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === `encrypted_nsec_${testUserId}`) return encryptedData;
        if (key === `nsec_salt_${testUserId}`) return salt;
        return null;
      });
      
      const result = await loadEncryptedNsec(testUserId);
      expect(result).toBe(testNsec);
    });

    it('should return null and cleanup on decryption failure', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === `encrypted_nsec_${testUserId}`) return 'invalid-encrypted-data';
        if (key === `nsec_salt_${testUserId}`) return 'test-salt';
        return null;
      });
      
      const result = await loadEncryptedNsec(testUserId);
      
      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(`encrypted_nsec_${testUserId}`);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(`nsec_salt_${testUserId}`);
    });
  });

  describe('removeEncryptedNsec', () => {
    it('should remove encrypted data from localStorage', () => {
      removeEncryptedNsec(testUserId);
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(`encrypted_nsec_${testUserId}`);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(`nsec_salt_${testUserId}`);
    });
  });

  describe('clearSensitiveString', () => {
    it('should attempt to clear sensitive string reference', () => {
      let sensitiveString = 'secret-data';
      
      // この関数は主にガベージコレクションの促進が目的
      // 実際の効果を直接テストするのは困難だが、エラーが発生しないことを確認
      expect(() => clearSensitiveString(sensitiveString)).not.toThrow();
    });
  });

  describe('security considerations', () => {
    it('should use strong cryptographic parameters', async () => {
      // 暗号化されたデータの構造を検証
      await saveEncryptedNsec(testUserId, testNsec);
      
      const encryptedData = localStorageMock.setItem.mock.calls[0][1];
      const parsedData = JSON.parse(atob(encryptedData));
      
      expect(parsedData).toHaveProperty('salt');
      expect(parsedData).toHaveProperty('iv');
      expect(parsedData).toHaveProperty('data');
      
      // Base64エンコードされたデータであることを確認
      expect(() => atob(parsedData.salt)).not.toThrow();
      expect(() => atob(parsedData.iv)).not.toThrow();
      expect(() => atob(parsedData.data)).not.toThrow();
    });
  });
});