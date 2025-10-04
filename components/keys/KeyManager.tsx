"use client";
import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { generatePrivateKey } from '../../features/keys/generate';
import { importKey } from '../../features/keys/import';
import { exportNsec } from '../../features/keys/export';
import { useAuthStore } from '../../stores/auth.store';
import { Modal } from '../ui/Modal';
import { useTranslation } from 'react-i18next';

export default function KeyManager() {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [input, setInput] = useState('');
  const [showNsec, setShowNsec] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const { npub, nsec } = useAuthStore();
  const loginWithNsec = useAuthStore(s => s.loginWithNsec);

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
          <h3 className="font-semibold text-base">{t('keyManager.privateKeyTitle')}</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowNsec(!showNsec)}
          >
            {showNsec ? t('keyManager.hide') : t('keyManager.show')}
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
            {copySuccess ? t('keyManager.copied') : t('keyManager.copy')}
          </Button>
        </div>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
          {t('keyManager.warning')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <Input
            placeholder={t('keyManager.importPlaceholder')}
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
          }}>{t('keyManager.importButton')}</Button>
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="font-medium mb-2">{t('keyManager.publicKeyLabel')}</div>
          <code className="break-all text-xs bg-white dark:bg-gray-800 p-2 rounded block">{npub || '-'}</code>
        </div>
      </div>
    </div>
  );
}
