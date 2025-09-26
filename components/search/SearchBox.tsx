"use client";

import { Search, X, Clock, History } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { useSearchStore } from '../../stores/search.store';
import { SearchType } from '../../features/search/types';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  onClear?: () => void;
  searchType?: SearchType;
  onHistorySelect?: (query: string) => void;
}

export function SearchBox({
  value,
  onChange,
  onSubmit,
  placeholder = "検索",
  autoFocus = false,
  onClear,
  searchType = 'all',
  onHistorySelect,
}: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const { getRecentSearches, getSuggestions, removeFromHistory } = useSearchStore();

  // 検索候補とドロップダウン表示の管理
  const recentSearches = getRecentSearches(5);
  const suggestions = getSuggestions(value);
  const dropdownItems = value.trim() ? suggestions : recentSearches.map(item => item.query);

  useEffect(() => {
    // モバイル判定
    const checkMobile = () => {
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileDevice = mobileRegex.test(userAgent) || window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ドロップダウン外クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // モバイルでない場合のみ自動フォーカス
    if (autoFocus && inputRef.current && !isMobile) {
      inputRef.current.focus();
    }
  }, [autoFocus, isMobile]);

  const handleClear = () => {
    onChange('');
    if (onClear) {
      onClear();
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || dropdownItems.length === 0) {
      if (e.key === 'Enter' && onSubmit) {
        e.preventDefault();
        onSubmit();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, dropdownItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < dropdownItems.length) {
          handleItemSelect(dropdownItems[focusedIndex]);
        } else if (onSubmit) {
          onSubmit();
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const handleItemSelect = (query: string) => {
    onChange(query);
    setShowDropdown(false);
    setFocusedIndex(-1);
    if (onHistorySelect) {
      onHistorySelect(query);
    }
  };

  const handleSearchClick = () => {
    if (onSubmit) {
      onSubmit();
    }
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowDropdown(true);
    setFocusedIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleSearchClick}
        className="absolute inset-y-0 left-0 pl-3 flex items-center z-10"
        title="検索"
      >
        <Search className="h-5 w-5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" />
      </button>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        className="w-full pl-10 pr-10 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-900 transition-all duration-200"
        placeholder={placeholder}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
          title="クリア"
        >
          <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
        </button>
      )}

      {/* 検索履歴・候補ドロップダウン */}
      {showDropdown && dropdownItems.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto z-20">
          <div className="p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
              {value.trim() ? (
                <><Search className="w-3 h-3" /> 検索候補</>
              ) : (
                <><History className="w-3 h-3" /> 最近の検索</>
              )}
            </div>
            {dropdownItems.map((item, index) => {
              const historyItem = value.trim() ? null : recentSearches.find(h => h.query === item);
              return (
                <button
                  key={`${item}-${index}`}
                  onClick={() => handleItemSelect(item)}
                  className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                    index === focusedIndex ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-900 dark:text-white truncate">{item}</span>
                  </div>
                  {historyItem && (
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {historyItem.resultCount}件
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(historyItem.id);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        title="履歴から削除"
                      >
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}