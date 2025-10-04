import { useTranslation as useTranslationBase } from 'react-i18next';

export function useTranslation() {
  return useTranslationBase();
}

export function useLocale(): string {
  const { i18n } = useTranslation();
  return i18n.language;
}
