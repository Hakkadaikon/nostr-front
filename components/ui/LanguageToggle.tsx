"use client";

import { Languages } from 'lucide-react';
import { useTranslation } from '../../lib/i18n/hooks';
import { supportedLocales, localeNames } from '../../lib/i18n/config';
import { clsx } from 'clsx';

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const currentLocale = i18n.language;

  const toggleLocale = () => {
    const newLocale = currentLocale === 'ja' ? 'en' : 'ja';

    // i18nの言語を変更
    i18n.changeLanguage(newLocale);

    // Cookieに保存
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${365 * 24 * 60 * 60}`;

    // ページをリロードして変更を反映
    window.location.reload();
  };

  return (
    <button
      onClick={toggleLocale}
      className={clsx(
        'flex items-center space-x-3 py-3 px-4 rounded-xl transition-all duration-200',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'group relative overflow-hidden w-full'
      )}
      aria-label={`Switch to ${currentLocale === 'ja' ? 'English' : '日本語'}`}
    >
      <Languages
        className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-all duration-200"
      />
      <span className="font-medium text-gray-700 dark:text-gray-200 transition-colors duration-200">
        {currentLocale === 'ja' ? 'EN' : 'JA'}
      </span>
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
}
