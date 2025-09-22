"use client";

import { Search, X } from 'lucide-react';
import { useRef, useEffect } from 'react';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  onClear?: () => void;
}

export function SearchBox({
  value,
  onChange,
  onSubmit,
  placeholder = "検索",
  autoFocus = false,
  onClear,
}: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

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
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleSearchClick = () => {
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleSearchClick}
        className="absolute inset-y-0 left-0 pl-3 flex items-center"
        title="検索"
      >
        <Search className="h-5 w-5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" />
      </button>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full pl-10 pr-10 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-gray-900 transition-all duration-200"
        placeholder={placeholder}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          title="クリア"
        >
          <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
        </button>
      )}
    </div>
  );
}