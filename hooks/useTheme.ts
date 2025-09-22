"use client";
import { useEffect, useState } from 'react';
import { useUiStore, Theme } from '../stores/ui.store';

export function useTheme() {
  const theme = useUiStore(s => s.theme);
  const setTheme = useUiStore(s => s.setTheme);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // システムテーマの検出
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    updateSystemTheme();
    mediaQuery.addEventListener('change', updateSystemTheme);

    return () => mediaQuery.removeEventListener('change', updateSystemTheme);
  }, []);

  // テーマの適用
  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, systemTheme]);

  // 実際に適用されているテーマ
  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  return { 
    theme, 
    setTheme, 
    resolvedTheme,
    systemTheme 
  };
}
