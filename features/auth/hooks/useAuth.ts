"use client";
import { useEffect, useState } from 'react';
import type { AuthState } from '../types';

export function useAuth(): AuthState {
  const [hasNip07, setHasNip07] = useState(false);
  useEffect(() => {
    setHasNip07(typeof (window as any).nostr !== 'undefined');
  }, []);
  return { hasNip07, npub: null, locked: true };
}
