"use client";

import { useTranslation } from '../../lib/i18n/hooks';
import { clsx } from 'clsx';

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const currentLocale = i18n.language;
  const isJapanese = currentLocale === 'ja';

  const toggleLocale = () => {
    const newLocale = isJapanese ? 'en' : 'ja';

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
      aria-label={`Switch to ${isJapanese ? 'English' : '日本語'}`}
    >
      {/* トグルスイッチ */}
      <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 dark:bg-gray-600 transition-colors duration-200">
        <span
          className={clsx(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
            isJapanese ? 'translate-x-1' : 'translate-x-6'
          )}
        />
      </div>

      {/* 現在の言語表示 */}
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors duration-200">
        {isJapanese ? 'JA' : 'EN'}
      </span>

      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
}
