"use client";
import { useEffect } from 'react';
import { useUiStore } from '../stores/ui.store';

export function useTheme() {
  const theme = useUiStore(s => s.theme);
  const setTheme = useUiStore(s => s.setTheme);
  useEffect(() => {
    const dark = theme === 'dark';
    document.documentElement.classList.toggle('dark', dark);
  }, [theme]);
  return { theme, setTheme };
}
