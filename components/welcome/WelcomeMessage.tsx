"use client";
import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../stores/auth.store';

export default function WelcomeMessage() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { nsec } = useAuthStore();

  useEffect(() => {
    // 初回アクセス時のみ表示（dismissedがfalseでnsecが存在する場合）
    const isDismissed = localStorage.getItem('welcome-dismissed');
    if (!isDismissed && nsec && !dismissed) {
      setShow(true);
    }
  }, [nsec, dismissed]);

  const handleDismiss = () => {
    localStorage.setItem('welcome-dismissed', 'true');
    setDismissed(true);
    setShow(false);
  };

  const handleCopyNsec = async () => {
    if (!nsec) return;
    await navigator.clipboard.writeText(nsec);
    alert('秘密鍵をクリップボードにコピーしました。安全な場所に保存してください。');
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="max-w-md mx-auto p-6 m-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-purple-600 dark:text-purple-400">
          🎉 ようこそ Nostr へ！
        </h2>

        <div className="space-y-4 text-sm">
          <p className="text-gray-700 dark:text-gray-300">
            アカウントが自動的に作成されました。以下の重要な情報をお読みください：
          </p>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              ⚠️ 重要：秘密鍵のバックアップ
            </p>
            <ul className="space-y-1 text-yellow-700 dark:text-yellow-300">
              <li>• あなたの秘密鍵（nsec）は自動的に生成されました</li>
              <li>• この鍵があなたの唯一のログイン方法です</li>
              <li>• パスワードリセットはできません</li>
              <li>• 必ず安全な場所にバックアップしてください</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCopyNsec}
              variant="primary"
              fullWidth
            >
              秘密鍵をコピー
            </Button>
            <Button
              onClick={handleDismiss}
              variant="secondary"
              fullWidth
            >
              理解しました
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            設定ページでいつでも秘密鍵を確認できます
          </p>
        </div>
      </div>
    </div>
  );
}