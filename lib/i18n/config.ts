import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ja from './locales/ja.json';
import en from './locales/en.json';

export const defaultLocale = 'ja';
export const supportedLocales = ['ja', 'en'] as const;
export type SupportedLocale = typeof supportedLocales[number];

export const localeNames: Record<SupportedLocale, string> = {
  ja: '日本語',
  en: 'English',
};

const resources = {
  ja: { translation: ja },
  en: { translation: en },
};

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
