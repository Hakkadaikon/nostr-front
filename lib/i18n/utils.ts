import { supportedLocales, type SupportedLocale } from './config';

export function getLocaleFromPathname(pathname: string): SupportedLocale | null {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (supportedLocales.includes(firstSegment as SupportedLocale)) {
    return firstSegment as SupportedLocale;
  }

  return null;
}

export function removeLocaleFromPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (locale) {
    return pathname.replace(`/${locale}`, '') || '/';
  }
  return pathname;
}

export function addLocaleToPathname(pathname: string, locale: SupportedLocale): string {
  const cleanPath = removeLocaleFromPathname(pathname);
  return `/${locale}${cleanPath}`;
}
