"use client";
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      className="rounded border px-2 py-1 text-sm"
      onClick={() => setDark(v => !v)}
    >
      {dark ? 'Dark' : 'Light'}
    </button>
  );
}
