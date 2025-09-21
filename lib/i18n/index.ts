import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/common.json';
import ja from './locales/ja/common.json';

export function setupI18n(lang: 'en' | 'ja' = 'ja') {
  if (i18n.isInitialized) {
    i18n.changeLanguage(lang);
    return i18n;
  }
  i18n.use(initReactI18next).init({
    resources: { en: { common: en }, ja: { common: ja } },
    lng: lang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
  return i18n;
}
