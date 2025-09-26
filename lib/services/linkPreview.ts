import { extractOgMetadata } from '../utils/og';

interface LinkPreviewData {
  url?: string;
  title?: string;
  description?: string;
  siteName?: string;
  image?: string;
}

const CORS_PROXY = 'https://corsproxy.io/?';
const FETCH_TIMEOUT_MS = 4000;
const MAX_HTML_LENGTH = 100_000;

// キャッシュ管理
const previewCache = new Map<string, LinkPreviewData | null>();
const CACHE_TTL = 30 * 60 * 1000; // 30分
const cacheTimestamps = new Map<string, number>();

/**
 * CORS対応プロキシを使用してリンクプレビューを取得
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
    // CORS Proxyを使用してフェッチ
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(normalizedUrl)}`;
    const response = await fetch(proxyUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      // HTMLでない場合はプレビューなし
      previewCache.set(normalizedUrl, null);
      cacheTimestamps.set(normalizedUrl, Date.now());
      return null;
    }

    // HTMLを取得（サイズ制限あり）
    const reader = response.body?.getReader();
    let chunks = '';
    let received = 0;

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          const text = new TextDecoder().decode(value);
          chunks += text;
          received += value.length;
        }
        if (received >= MAX_HTML_LENGTH) break;
      }
      reader.cancel();
    } else {
      chunks = await response.text();
      if (chunks.length > MAX_HTML_LENGTH) {
        chunks = chunks.slice(0, MAX_HTML_LENGTH);
      }
    }

    // OGメタデータを抽出
    const metadata = extractOgMetadata(chunks);
    metadata.url = metadata.url || normalizedUrl;

    // 画像URLの正規化
    if (metadata.image) {
      try {
        const imageUrl = new URL(metadata.image, normalizedUrl);
        metadata.image = imageUrl.toString();
      } catch {
        // 無効な画像URLの場合は削除
        delete metadata.image;
      }
    }

    // キャッシュに保存
    previewCache.set(normalizedUrl, metadata);
    cacheTimestamps.set(normalizedUrl, Date.now());

    return metadata;
  } catch (error) {
    console.error('Failed to fetch link preview:', error);
    // エラーの場合もキャッシュ（nullとして）
    previewCache.set(normalizedUrl, null);
    cacheTimestamps.set(normalizedUrl, Date.now());
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * キャッシュをクリア
 */
export function clearLinkPreviewCache(): void {
  previewCache.clear();
  cacheTimestamps.clear();
}