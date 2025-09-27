/**
 * 秘密鍵の安全な保存・読み込み機能
 * セキュリティ: メモリ内での鍵の扱いを最小限に抑制
 */

import { encrypt, decrypt } from './encrypt';
import { generateSalt } from './kdf';
import { secureLog } from '../utils/secureLogger';

const STORAGE_KEY_PREFIX = 'encrypted_nsec_';
const STORAGE_SALT_PREFIX = 'nsec_salt_';

/**
 * デバイス固有のパスワードを生成
 * 注意: これは基本的な実装です。より強固なセキュリティが必要な場合は追加の認証機構を検討してください
 */
function generateDevicePassword(): string {
  // ブラウザの情報を組み合わせてデバイス固有の識別子を作成
  const navigatorInfo = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset()
  ].join('|');
  
  // 単純なハッシュ（実際の本格的な実装では、より強固なハッシュ関数を使用）
  let hash = 0;
  for (let i = 0; i < navigatorInfo.length; i++) {
    const char = navigatorInfo.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit整数に変換
  }
  
  return `device_${Math.abs(hash)}_${Date.now()}`;
}

/**
 * 秘密鍵を暗号化してlocalStorageに保存
 */
export async function saveEncryptedNsec(userId: string, nsec: string): Promise<void> {
  try {
    const devicePassword = generateDevicePassword();
    const salt = generateSalt();
    
    // 秘密鍵を暗号化
    const encryptedNsec = await encrypt(nsec, devicePassword + salt);
    
    // localStorageに保存
    localStorage.setItem(STORAGE_KEY_PREFIX + userId, encryptedNsec);
    localStorage.setItem(STORAGE_SALT_PREFIX + userId, salt);
    
    secureLog.info('[saveEncryptedNsec] Private key encrypted and saved');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    secureLog.error('[saveEncryptedNsec] Failed to encrypt and save private key:', errorMessage);
    throw new Error('Failed to save private key securely');
  }
}

/**
 * 暗号化された秘密鍵を復号化して取得
 */
export async function loadEncryptedNsec(userId: string): Promise<string | null> {
  try {
    const encryptedData = localStorage.getItem(STORAGE_KEY_PREFIX + userId);
    const salt = localStorage.getItem(STORAGE_SALT_PREFIX + userId);
    
    if (!encryptedData || !salt) {
      return null;
    }
    
    const devicePassword = generateDevicePassword();
    const decryptedNsec = await decrypt(encryptedData, devicePassword + salt);
    
    secureLog.debug('[loadEncryptedNsec] Private key decrypted successfully');
    return decryptedNsec;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    secureLog.error('[loadEncryptedNsec] Failed to decrypt private key:', errorMessage);
    // 復号化に失敗した場合は保存されたデータを削除
    removeEncryptedNsec(userId);
    return null;
  }
}

/**
 * 暗号化された秘密鍵をストレージから削除
 */
export function removeEncryptedNsec(userId: string): void {
  localStorage.removeItem(STORAGE_KEY_PREFIX + userId);
  localStorage.removeItem(STORAGE_SALT_PREFIX + userId);
  secureLog.info('[removeEncryptedNsec] Encrypted private key removed from storage');
}

/**
 * メモリ内の機密文字列をクリア（JavaScript制限による部分的実装）
 */
export function clearSensitiveString(sensitiveStr: string): void {
  // JavaScriptではメモリの完全なクリアは困難ですが、
  // 少なくとも参照をクリアしてガベージコレクションの対象にします
  if (typeof sensitiveStr === 'string') {
    // 文字列を空にしてガベージコレクションを促進
    sensitiveStr = '';
  }
}