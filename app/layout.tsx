import '../styles/globals.css';
import type { ReactNode } from 'react';
import { MainLayout } from '../components/layout/MainLayout';

export const metadata = {
  title: 'X Clone',
  description: 'A Twitter/X clone built with Next.js + Tailwind',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
