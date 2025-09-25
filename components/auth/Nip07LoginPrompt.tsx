"use client";

import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../stores/auth.store';
import { nip19 } from 'nostr-tools';
import Link from 'next/link';

export default function Nip07LoginPrompt() {
  const { hasNip07, npub, publicKey } = useAuthStore();
  const unlock = useAuthStore(s => s.unlock);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const ua = navigator.userAgent || '';
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    setIsMobile(mobileRegex.test(ua));
  }, []);

  if (npub || publicKey) return null;

  const handleLogin = async () => {
    setLoading(true);
    try {
      if (!(window as any).nostr) return;
      const pubkey = await (window as any).nostr.getPublicKey();
      if (pubkey) {
        const npub = nip19.npubEncode(pubkey);
        unlock();
        useAuthStore.setState({ npub, publicKey: pubkey, locked: false });
      }
    } catch (e) {
      console.error('NIP-07 login failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 rounded-lg border border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-purple-700 dark:text-purple-300">NIP-07でログイン</p>
          {hasNip07 ? (
            <p className="text-sm text-purple-700/80 dark:text-purple-300/80">Nostr拡張機能が検出されました。ログインして投稿や反応を行えます。</p>
          ) : isMobile ? (
            <p className="text-sm text-purple-700/80 dark:text-purple-300/80">
              モバイルブラウザではNIP-07拡張機能を追加できません。代わりにモバイル対応のNostrアプリで共有するか、設定内のキー管理から秘密鍵を読み込んでログインしてください。
            </p>
          ) : (
            <p className="text-sm text-purple-700/80 dark:text-purple-300/80">ブラウザにNostr拡張機能が見つかりません。対応拡張機能（Alby, nos2xなど）をインストールしてください。</p>
          )}
        </div>
        {hasNip07 ? (
          <Button onClick={handleLogin} disabled={loading}>
            {loading ? '接続中...' : 'NIP-07でログイン'}
          </Button>
        ) : isMobile ? (
          <Link
            href="/settings"
            className="inline-block whitespace-nowrap px-4 py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700"
          >
            キー管理を開く
          </Link>
        ) : (
          <a
            href="https://welcome.nostr-jp.org/tutorial/nip-07.html" target="_blank" rel="noreferrer"
            className="px-4 py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700"
          >
            拡張機能を入手
          </a>
        )}
      </div>
    </div>
  );
}
