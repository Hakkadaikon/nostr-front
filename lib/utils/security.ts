/**
 * セキュリティユーティリティ関数
 */

/**
 * XSSを防ぐためのHTMLエスケープ処理
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * URLのバリデーション
 * 安全なプロトコルのみ許可
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Content Security Policyのnonce生成
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)));
}

/**
 * 入力値のサニタイゼーション
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  // 制御文字を削除
  let sanitized = input.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  // 文字数制限
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * ファイル名のサニタイゼーション
 */
export function sanitizeFileName(fileName: string): string {
  // 危険な文字を削除
  return fileName
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\.{2,}/g, '.') // 連続するドットを防ぐ
    .trim();
}

/**
 * MIME typeの検証
 */
export function isValidMimeType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.some(allowed => {
    if (allowed.endsWith('/*')) {
      const prefix = allowed.slice(0, -2);
      return mimeType.startsWith(prefix + '/');
    }
    return mimeType === allowed;
  });
}

/**
 * CSRFトークンの生成
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Rate limiting用のキー生成
 */
export function getRateLimitKey(identifier: string, action: string): string {
  return `ratelimit:${action}:${identifier}`;
}