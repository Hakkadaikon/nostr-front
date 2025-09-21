import '../styles/globals.css';
import type { ReactNode } from 'react';
import AppShell from '../components/layout/AppShell';

export const metadata = {
  title: 'Nostr Web Client',
  description: 'Minimal Nostr client skeleton built with Next.js + Tailwind',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
