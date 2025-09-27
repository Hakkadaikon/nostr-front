"use client";
import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { generatePrivateKey } from '../../features/keys/generate';
import { importKey } from '../../features/keys/import';
import { exportNsec } from '../../features/keys/export';
import { useAuthStore } from '../../stores/auth.store';
import { Modal } from '../ui/Modal';

export default function KeyManager() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [input, setInput] = useState('');
  const [showNsec, setShowNsec] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const { npub, nsec, locked, saveNsecEnabled } = useAuthStore();
  const loginWithNsec = useAuthStore(s => s.loginWithNsec);
  const lock = useAuthStore(s => s.lock);
  const unlock = useAuthStore(s => s.unlock);
  const logout = useAuthStore(s => s.logout);
  const enableNsecSaving = useAuthStore(s => s.enableNsecSaving);

  const handleCopyNsec = async () => {
    if (!nsec) return;
    await navigator.clipboard.writeText(nsec);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* 秘密鍵表示セクション */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">あなたの秘密鍵 (nsec)</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowNsec(!showNsec)}
          >
            {showNsec ? '非表示' : '表示'}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 p-2 rounded bg-white/50 dark:bg-gray-900/50 text-xs break-all">
            {showNsec ? nsec : '•'.repeat(63)}
          </code>
          <Button
            size="sm"
            variant={copySuccess ? "success" : "secondary"}
            onClick={handleCopyNsec}
          >
            {copySuccess ? '✓' : 'コピー'}
          </Button>
        </div>
        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
          ⚠️ この秘密鍵を安全な場所にバックアップしてください。絶対に他人に教えないでください。
        </p>
      </div>

      {/* nsec保存設定 */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={saveNsecEnabled}
            onChange={(e) => enableNsecSaving(e.target.checked)}
            className="w-4 h-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600"
          />
          <span className="text-sm">秘密鍵をブラウザに保存</span>
        </label>
        {!saveNsecEnabled && (
          <span className="text-xs text-red-600 dark:text-red-400">
            ⚠️ オフにするとブラウザを閉じたときにログアウトされます
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={() => {
          const { npub, nsec } = generatePrivateKey();
          loginWithNsec(npub, nsec);
        }}>新しい鍵を生成</Button>
        {locked ? (
          <Button onClick={unlock}>Unlock</Button>
        ) : (
          <Button onClick={lock}>Lock</Button>
        )}
        <Button onClick={logout}>Logout</Button>
      </div>
      <div className="flex gap-2">
        <Input placeholder="既存のnsecをインポート" value={input} onChange={e => setInput(e.target.value)} />
        <Button onClick={() => {
          const r = importKey(input.trim());
          if (r.ok && r.npub) {
            loginWithNsec(r.npub, r.nsec);
            setInput('');
          }
        }}>インポート</Button>
      </div>
      <div className="text-xs text-gray-500">
        <div>npub (公開鍵): <code className="break-all">{npub || '-'}</code></div>
      </div>
    </div>
  );
}
