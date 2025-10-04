import '../styles/globals.css';
import type { ReactNode } from 'react';
import { MainLayout } from '../components/layout/MainLayout';

export const metadata = {
  title: 'hamnostr',
  description: 'A Twitter/X clone built with Next.js + Tailwind',
  metadataBase: new URL('https://hamnostr.com'),
  openGraph: {
    title: 'hamnostr',
    description: 'A Twitter/X clone built with Next.js + Tailwind',
    url: 'https://hamnostr.com',
    siteName: 'hamnostr',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'hamnostr',
    description: 'A Twitter/X clone built with Next.js + Tailwind',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
