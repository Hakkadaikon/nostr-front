import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ja from './locales/ja.json';
import en from './locales/en.json';

export const supportedLocales = ['ja', 'en'] as const;
export type SupportedLocale = typeof supportedLocales[number];

export const localeNames: Record<SupportedLocale, string> = {
  ja: '日本語', // Keep native language names as-is for language selector
  en: 'English',
};

const resources = {
  ja: { translation: ja },
  en: { translation: en },
};

// ブラウザの言語を検出してデフォルト言語を決定
export const getBrowserLocale = (): SupportedLocale => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const browserLang = navigator.language.toLowerCase();

  // ja または ja-XX の場合は日本語、それ以外は英語
  if (browserLang.startsWith('ja')) {
    return 'ja';
  }

  return 'en';
};

export const defaultLocale: SupportedLocale = 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLocale,
    fallbackLng: defaultLocale,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
