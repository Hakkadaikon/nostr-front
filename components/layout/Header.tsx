"use client";

import { useAuthStore } from '../../stores/auth.store';
import Link from 'next/link';

export default function Header() {
  const npub = useAuthStore((state) => state.npub);
  
  return (
    <div className="flex items-center gap-3 py-2">
      {npub ? (
        <Link
          href={`/profile/${npub}`}
          className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:scale-105 transition-transform duration-200"
        >
          Nostr Web Client
        </Link>
      ) : (
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:scale-105 transition-transform duration-200">
          Nostr Web Client
        </h1>
      )}
    </div>
  );
}
