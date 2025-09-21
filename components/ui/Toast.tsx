"use client";
import { useEffect } from 'react';

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-4 right-4 rounded bg-gray-800 px-3 py-2 text-sm text-white shadow">
      {message}
    </div>
  );
}
