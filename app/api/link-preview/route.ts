import { NextRequest, NextResponse } from 'next/server';
import { extractOgMetadata } from '../../../lib/utils/og';

const FETCH_TIMEOUT_MS = 6000;
const MAX_HTML_LENGTH = 100_000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  // URLの正規化
  let normalizedUrl: string;
  try {
    normalizedUrl = new URL(url).toString();
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    // サーバーサイドから直接フェッチ（CORSの問題なし）
    const response = await fetch(normalizedUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch: ${response.status}` }, { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      return NextResponse.json({ error: 'Not an HTML page' }, { status: 400 });
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
        delete metadata.image;
      }
    }

    return NextResponse.json(metadata);
  } catch (error) {
    clearTimeout(timeout);
    console.error('Failed to fetch link preview:', error);
    return NextResponse.json({ error: 'Failed to fetch link preview' }, { status: 500 });
  }
}
