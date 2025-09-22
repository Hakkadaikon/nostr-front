"use client";

import { useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // テーマの初期化
  useTheme();
  
  // hydration対策
  useEffect(() => {
    // クライアントサイドでのみ実行
    const root = document.documentElement;
    const savedTheme = localStorage.getItem('ui-preferences');
    
    if (savedTheme) {
      try {
        const { state } = JSON.parse(savedTheme);
        const theme = state?.theme || 'system';
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
        
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
  
  return <>{children}</>;
}