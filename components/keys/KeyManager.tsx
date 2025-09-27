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

  const { npub, nsec, saveNsecEnabled } = useAuthStore();
  const loginWithNsec = useAuthStore(s => s.loginWithNsec);
  const enableNsecSaving = useAuthStore(s => s.enableNsecSaving);

  const handleCopyNsec = async () => {
    if (!nsec) return;
    await navigator.clipboard.writeText(nsec);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 秘密鍵表示セクション */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base">あなたの秘密鍵 (nsec)</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowNsec(!showNsec)}
          >
            {showNsec ? '非表示' : '表示'}
          </Button>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <code className="flex-1 p-3 rounded-lg bg-white/70 dark:bg-gray-900/70 text-xs break-all border">
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
        <p className="text-sm text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
          ⚠️ この秘密鍵を安全な場所にバックアップしてください。絶対に他人に教えないでください。
        </p>
      </div>

      {/* 秘密鍵保存設定 */}
      <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
        <label className="flex items-center gap-3 cursor-pointer flex-1">
          <input
            type="checkbox"
            checked={saveNsecEnabled}
            onChange={(e) => enableNsecSaving(e.target.checked)}
            className="w-5 h-5 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600"
          />
          <div>
            <span className="text-sm font-medium">秘密鍵を暗号化して永続保存</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-xs text-blue-600 dark:text-blue-400">
                🔒 AES-256暗号化
              </div>
              {!saveNsecEnabled && (
                <span className="text-xs text-red-600 dark:text-red-400">
                  ⚠️ オフにするとブラウザを閉じたときに秘密鍵が失われます
                </span>
              )}
            </div>
          </div>
        </label>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <Input 
            placeholder="既存のnsecをインポート" 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            className="flex-1"
          />
          <Button onClick={async () => {
            const r = importKey(input.trim());
            if (r.ok && r.npub) {
              await loginWithNsec(r.npub, r.nsec);
              setInput('');
            }
          }}>インポート</Button>
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="font-medium mb-2">公開鍵 (npub)</div>
          <code className="break-all text-xs bg-white dark:bg-gray-800 p-2 rounded block">{npub || '-'}</code>
        </div>
      </div>
    </div>
  );
}
