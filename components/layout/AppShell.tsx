"use client";
import { ReactNode, useEffect } from 'react';
import NavSidebar from './NavSidebar';
import Header from './Header';
import ThemeToggle from './ThemeToggle';
import { Toast } from '../ui/Toast';
import { useToast } from '../../hooks/useToast';
import { setupI18n } from '../../lib/i18n';

export default function AppShell({ children }: { children: ReactNode }) {
  const { toast, clear } = useToast();
  useEffect(() => {
    const lang = (navigator?.language?.startsWith('ja') ? 'ja' : 'en') as 'ja' | 'en';
    setupI18n(lang);
    let timer: any;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try { require('../../stores/auth.store').useAuthStore.getState().lock(); } catch {}
      }, 3 * 60 * 1000);
    };
    ['mousemove','keydown','click','touchstart'].forEach(evt => window.addEventListener(evt, reset));
    reset();
    return () => {
      clearTimeout(timer);
      ['mousemove','keydown','click','touchstart'].forEach(evt => window.removeEventListener(evt, reset));
    };
  }, []);
  return (
    <div className="container py-4">
      <header className="mb-6 flex items-center justify-between gap-4">
        <Header />
        <ThemeToggle />
      </header>
      <div className="grid grid-cols-1 md:grid-cols-[16rem_minmax(0,1fr)] gap-6">
        <NavSidebar />
        <main>{children}</main>
      </div>
      {toast && <Toast message={toast} onClose={clear} />}
    </div>
  );
}
