import { NextRequest, NextResponse } from 'next/server';
import { extractOgMetadata } from '../../../lib/utils/og';

const FETCH_TIMEOUT_MS = 4000;
const MAX_HTML_LENGTH = 100_000;

function createError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');

  if (!target) {
    return createError('Missing url parameter');
  }

  try {
    const parsed = new URL(target);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return createError('Unsupported protocol');
    }
  } catch {
    return createError('Invalid URL');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(target, {
      method: 'GET',
      headers: {
        'User-Agent': 'nostr-front/1.0 (+https://github.com/Hakkadaikon/nostr-front)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return createError('Failed to fetch target', response.status);
    }

    const reader = response.body?.getReader();
    let received = 0;
    let chunks = '';

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
    } else {
      chunks = await response.text();
      if (chunks.length > MAX_HTML_LENGTH) {
        chunks = chunks.slice(0, MAX_HTML_LENGTH);
      }
    }

    const metadata = extractOgMetadata(chunks);
    metadata.url = metadata.url || target;

    return NextResponse.json(metadata, {
      headers: {
        'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return createError('Request timed out', 504);
    }
    return createError('Failed to fetch target', 500);
  } finally {
    clearTimeout(timeout);
  }
}
