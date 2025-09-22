"use client";

import { useEffect, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  // テーマの初期化
  useTheme();

  useEffect(() => {
    setIsMounted(true);

    // クライアントサイドでのみテーマを適用
    const root = document.documentElement;
    const savedTheme = localStorage.getItem('ui-preferences');

    if (savedTheme) {
      try {
        const { state } = JSON.parse(savedTheme);
        const theme = state?.theme || 'system';
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
        const isDark =
          theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

        if (isDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      } catch (e) {
        // エラーの場合はシステム設定に従う
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        }
      }
    }
  }, []);

  // マウントされるまでは何も表示しないことで、ハイドレーションエラーを防ぐ
  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
}
