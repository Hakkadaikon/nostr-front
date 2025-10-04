interface LinkPreviewData {
  url?: string;
  title?: string;
  description?: string;
  siteName?: string;
  image?: string;
}

const FETCH_TIMEOUT_MS = 6000;

// キャッシュ管理
const previewCache = new Map<string, LinkPreviewData | null>();
const CACHE_TTL = 30 * 60 * 1000; // 30分
const cacheTimestamps = new Map<string, number>();

/**
 * Next.js APIルートを使用してリンクプレビューを取得
 */
export async function fetchLinkPreview(url: string): Promise<LinkPreviewData | null> {
  // URLの正規化
  let normalizedUrl: string;
  try {
    normalizedUrl = new URL(url).toString();
  } catch {
    return null;
  }

  // キャッシュチェック
  if (previewCache.has(normalizedUrl)) {
    const cachedTime = cacheTimestamps.get(normalizedUrl) || 0;
    if (Date.now() - cachedTime < CACHE_TTL) {
      return previewCache.get(normalizedUrl) || null;
    }
    // 古いキャッシュを削除
    previewCache.delete(normalizedUrl);
    cacheTimestamps.delete(normalizedUrl);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    // Next.js APIルートを使用（CORSの問題なし）
    const apiUrl = `/api/link-preview?url=${encodeURIComponent(normalizedUrl)}`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      previewCache.set(normalizedUrl, null);
      cacheTimestamps.set(normalizedUrl, Date.now());
      return null;
    }

    const metadata = await response.json();

    // キャッシュに保存
    previewCache.set(normalizedUrl, metadata);
    cacheTimestamps.set(normalizedUrl, Date.now());

    return metadata;
  } catch (error) {
    clearTimeout(timeout);
    // エラーの場合もキャッシュ（nullとして）
    previewCache.set(normalizedUrl, null);
    cacheTimestamps.set(normalizedUrl, Date.now());
    return null;
  }
}

/**
 * キャッシュをクリア
 */
export function clearLinkPreviewCache(): void {
  previewCache.clear();
  cacheTimestamps.clear();
}