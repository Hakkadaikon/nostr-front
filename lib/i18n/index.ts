export { I18nProvider } from './I18nProvider';
export { useTranslation, useLocale } from './hooks';
export {
  defaultLocale,
  supportedLocales,
  localeNames,
  getBrowserLocale,
  type SupportedLocale
} from './config';
export {
  getLocaleFromPathname,
  removeLocaleFromPathname,
  addLocaleToPathname
} from './utils';
export { default as i18n } from './config';
