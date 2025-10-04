import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const supportedLocales = ['ja', 'en'] as const;
const defaultLocale = 'ja';

function getLocale(request: NextRequest): string {
  // 1. URLパスからロケールを取得（優先度最高）
  const pathname = request.nextUrl.pathname;
  const pathnameLocale = supportedLocales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  if (pathnameLocale) return pathnameLocale;

  // 2. Cookieからロケールを取得
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && supportedLocales.includes(cookieLocale as any)) {
    return cookieLocale;
  }

  // 3. Accept-Languageヘッダーからロケールを取得
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const browserLocale = acceptLanguage.split(',')[0].split('-')[0];
    if (supportedLocales.includes(browserLocale as any)) {
      return browserLocale;
    }
  }

  // 4. デフォルトロケール
  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 静的ファイルやAPIルートはスキップ
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  // ロケールの判定
  const locale = getLocale(request);

  const response = NextResponse.next();

  // ロケールをCookieに保存
  response.cookies.set('NEXT_LOCALE', locale, {
    maxAge: 365 * 24 * 60 * 60, // 1年
    path: '/',
  });

  applySecurityHeaders(response);
  handleCSRF(request, response);

  return response;
}

function applySecurityHeaders(response: NextResponse) {

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com https://platform.twitter.com https://cdn.syndication.twimg.com https://syndication.twitter.com",
    "style-src 'self' 'unsafe-inline' https://platform.twitter.com",
    "img-src 'self' data: https: blob: https://nostrcheck.me https://cdn.nostrcheck.me https://pbs.twimg.com https://abs.twimg.com https://platform.twitter.com https://syndication.twitter.com",
    "font-src 'self'",
    "connect-src 'self' wss://* https://*.nostr.build https://nostrcheck.me https://cdn.nostrcheck.me https://blossom.primal.net https://platform.twitter.com https://cdn.syndication.twimg.com https://syndication.twitter.com https://pbs.twimg.com https://api.allorigins.win https://corsproxy.io",
    "media-src 'self' https: https://nostrcheck.me https://cdn.nostrcheck.me https://pbs.twimg.com https://video.twimg.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'self' https://www.youtube.com https://youtube.com https://platform.twitter.com https://syndication.twitter.com https://open.spotify.com",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspHeader);
}

function handleCSRF(request: NextRequest, response: NextResponse) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    if (origin && host) {
      const expectedOrigin = `${request.nextUrl.protocol}//${host}`;
      if (origin !== expectedOrigin) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
