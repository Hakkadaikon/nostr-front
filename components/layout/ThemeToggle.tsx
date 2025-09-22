"use client";
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../stores/ui.store';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    const themeOrder: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor size={20} />;
    }
    return resolvedTheme === 'dark' ? <Moon size={20} /> : <Sun size={20} />;
  };

  const getLabel = () => {
    if (theme === 'system') return 'システム';
    return theme === 'dark' ? 'ダーク' : 'ライト';
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 flex items-center gap-2"
      aria-label="テーマを変更"
      title={`現在のテーマ: ${getLabel()}`}
    >
      {getIcon()}
      <span className="text-sm hidden sm:inline text-gray-700 dark:text-gray-300">
        {getLabel()}
      </span>
    </button>
  );
}
