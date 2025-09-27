/**
 * 統一されたアバター生成ユーティリティ
 * 同じユーザーには常に同じアバターを表示するために、pubkeyを基準とする
 */

/**
 * ユーザーのデフォルトアバターURLを生成
 * @param pubkey - ユーザーの公開鍵（hex形式）
 * @returns アバターURL
 */
export function generateDefaultAvatar(pubkey: string): string {
  if (!pubkey) {
    return `https://robohash.org/default?set=set4`;
  }
  
  // pubkeyを使って一意かつ一貫性のあるアバターを生成
  // set=set4: 可愛らしいキトン（子猫）スタイル
  return `https://robohash.org/${pubkey}?set=set4&size=200x200`;
}

/**
 * プロフィール画像のURLを取得（優先度順）
 * @param customAvatar - カスタムアバター（プロフィール設定）
 * @param pubkey - ユーザーの公開鍵
 * @returns アバターURL
 */
export function getProfileImageUrl(customAvatar: string | null | undefined, pubkey: string): string {
  // カスタムアバターがある場合はそれを使用
  if (customAvatar && customAvatar.trim() && customAvatar !== '') {
    return customAvatar;
  }
  
  // なければデフォルトアバターを生成
  return generateDefaultAvatar(pubkey);
}

/**
 * アバターURLの検証とフォールバック処理
 * @param avatarUrl - アバターURL
 * @param pubkey - ユーザーの公開鍵（フォールバック用）
 * @returns 有効なアバターURL
 */
export function validateAvatarUrl(avatarUrl: string | null | undefined, pubkey: string): string {
  // 無効なURLの場合はデフォルトアバターを返す
  if (!avatarUrl || avatarUrl.trim() === '') {
    return generateDefaultAvatar(pubkey);
  }
  
  try {
    new URL(avatarUrl);
    return avatarUrl;
  } catch {
    // 不正なURLの場合はデフォルトアバターを返す
    return generateDefaultAvatar(pubkey);
  }
}