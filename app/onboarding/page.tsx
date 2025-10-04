"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/auth.store';
import { generatePrivateKey } from '../../features/keys/generate';
import { importKey } from '../../features/keys/import';
import { Key, Download, Wallet } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { useTranslation } from 'react-i18next';

export default function OnboardingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState<'choose' | 'generate' | 'import'>('choose');
  const [importInput, setImportInput] = useState('');
  const [generatedKeys, setGeneratedKeys] = useState<{ npub: string; nsec: string } | null>(null);
  const [showNsec, setShowNsec] = useState(false);
  const hasNip07 = useAuthStore(s => s.hasNip07);
  const loginWithNsec = useAuthStore(s => s.loginWithNsec);
  const unlock = useAuthStore(s => s.unlock);

  const handleGenerate = () => {
    const keys = generatePrivateKey();
    setGeneratedKeys(keys);
    setStep('generate');
  };

  const handleConfirmGenerate = async () => {
    if (generatedKeys) {
      await loginWithNsec(generatedKeys.npub, generatedKeys.nsec);
      router.push('/');
    }
  };

  const handleImport = async () => {
    const result = importKey(importInput.trim());
    if (result.ok && result.npub) {
      await loginWithNsec(result.npub, result.nsec);
      router.push('/');
    } else {
      alert(t('page.onboarding.existingKey.invalidKey'));
    }
  };

  const handleNip07 = async () => {
    if (!(window as any).nostr) {
      alert(t('page.onboarding.nip07.notInstalled'));
      return;
    }

    try {
      const pubkey: string = await (window as any).nostr.getPublicKey();
      if (pubkey) {
        const npub = nip19.npubEncode(pubkey);
        unlock();
        useAuthStore.setState({
          npub,
          publicKey: pubkey,
          pubkey,
          locked: false,
        });
        router.push('/');
      }
    } catch (error) {
      alert(t('page.onboarding.nip07.accessFailed'));
    }
  };

  if (step === 'generate' && generatedKeys) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">{t('page.onboarding.generateKey.success')}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('page.onboarding.generateKey.accountCreated')}
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="space-y-2">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                {t('page.onboarding.generateKey.warning')}
              </h3>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                <li>{t('page.onboarding.generateKey.warningItems.item1')}</li>
                <li>{t('page.onboarding.generateKey.warningItems.item2')}</li>
                <li>{t('page.onboarding.generateKey.warningItems.item3')}</li>
                <li>{t('page.onboarding.generateKey.warningItems.item4')}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{t('page.onboarding.generateKey.privateKey')}</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowNsec(!showNsec)}
              >
                {showNsec ? t('page.onboarding.generateKey.hide') : t('page.onboarding.generateKey.show')}
              </Button>
            </div>
            <code className="block p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs break-all font-mono">
              {showNsec ? generatedKeys.nsec : '•'.repeat(63)}
            </code>
            {showNsec && (
              <Button
                className="w-full mt-3"
                onClick={() => {
                  navigator.clipboard.writeText(generatedKeys.nsec);
                  alert(t('page.onboarding.generateKey.copied'));
                }}
              >
                {t('page.onboarding.generateKey.copy')}
              </Button>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold mb-3">{t('page.onboarding.generateKey.publicKey')}</h3>
            <code className="block p-3 bg-white dark:bg-gray-800 rounded-lg text-xs break-all font-mono">
              {generatedKeys.npub}
            </code>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              setStep('choose');
              setGeneratedKeys(null);
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleConfirmGenerate}
          >
            {t('page.onboarding.generateKey.saveAndStart')}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'import') {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">{t('page.onboarding.existingKey.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('page.onboarding.existingKey.prompt')}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t('page.onboarding.existingKey.label')}</label>
            <Input
              type="password"
              placeholder="nsec1..."
              value={importInput}
              onChange={e => setImportInput(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {t('page.onboarding.existingKey.hint')}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setStep('choose')}
          >
            {t('page.onboarding.existingKey.back')}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleImport}
            disabled={!importInput.trim()}
          >
            {t('page.onboarding.existingKey.login')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold">{t('page.onboarding.welcome')}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t('page.onboarding.subtitle')}
        </p>
      </div>

      <div className="grid gap-4">
        <button
          onClick={handleGenerate}
          className="group relative p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-2xl hover:border-purple-400 dark:hover:border-purple-600 transition-all text-left"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
              <Key className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">{t('page.onboarding.generateKey.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('page.onboarding.generateKey.description')}
              </p>
              <div className="mt-3 text-xs text-purple-600 dark:text-purple-400 font-medium">
                {t('page.onboarding.generateKey.recommended')}
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => setStep('import')}
          className="group relative p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl hover:border-gray-400 dark:hover:border-gray-600 transition-all text-left"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
              <Download className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">{t('page.onboarding.existingKey.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('page.onboarding.existingKey.description')}
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={handleNip07}
          className="group relative p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl hover:border-gray-400 dark:hover:border-gray-600 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!hasNip07}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
              <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">{t('page.onboarding.nip07.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('page.onboarding.nip07.description')}
              </p>
              <div className="mt-2 text-xs">
                {hasNip07 ? (
                  <span className="text-blue-600 dark:text-blue-300">{t('page.onboarding.nip07.detected')}</span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-500">{t('page.onboarding.nip07.notFound')}</span>
                )}
              </div>
            </div>
          </div>
        </button>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-3">{t('page.onboarding.about.title')}</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>{t('page.onboarding.about.items.item1')}</li>
          <li>{t('page.onboarding.about.items.item2')}</li>
          <li>{t('page.onboarding.about.items.item3')}</li>
          <li>{t('page.onboarding.about.items.item4')}</li>
        </ul>
      </div>
    </div>
  );
}
