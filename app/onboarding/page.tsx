"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/auth.store';
import { generatePrivateKey } from '../../features/keys/generate';
import { importKey } from '../../features/keys/import';
import { Key, Download, Wallet } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<'choose' | 'generate' | 'import'>('choose');
  const [importInput, setImportInput] = useState('');
  const [generatedKeys, setGeneratedKeys] = useState<{ npub: string; nsec: string } | null>(null);
  const [showNsec, setShowNsec] = useState(false);
  const loginWithNsec = useAuthStore(s => s.loginWithNsec);

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
      alert('無効な秘密鍵です。nsec形式で入力してください。');
    }
  };

  const handleNip07 = async () => {
    if (window.nostr) {
      try {
        const pubkey = await window.nostr.getPublicKey();
        // NIP-07の場合はnsecなしでログイン（拡張機能が署名を処理）
        alert('NIP-07拡張機能を使用する機能は現在開発中です。');
      } catch (error) {
        alert('NIP-07拡張機能へのアクセスに失敗しました。');
      }
    } else {
      alert('NIP-07対応の拡張機能（Alby、nos2x等）がインストールされていません。');
    }
  };

  if (step === 'generate' && generatedKeys) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">🎉 新しい鍵を生成しました</h1>
          <p className="text-gray-600 dark:text-gray-400">
            あなたのNostrアカウントが作成されました
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="space-y-2">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                重要：秘密鍵を必ずバックアップしてください
              </h3>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                <li>• この秘密鍵があなたの唯一のログイン方法です</li>
                <li>• パスワードリセットはできません</li>
                <li>• 秘密鍵を失うとアカウントに二度とアクセスできません</li>
                <li>• 安全な場所（パスワードマネージャー等）に保存してください</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">秘密鍵 (nsec)</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowNsec(!showNsec)}
              >
                {showNsec ? '非表示' : '表示'}
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
                  alert('秘密鍵をコピーしました');
                }}
              >
                秘密鍵をコピー
              </Button>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold mb-3">公開鍵 (npub)</h3>
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
            キャンセル
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleConfirmGenerate}
          >
            秘密鍵を保存して開始
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'import') {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">既存の秘密鍵でログイン</h1>
          <p className="text-gray-600 dark:text-gray-400">
            お持ちの秘密鍵（nsec）を入力してください
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">秘密鍵 (nsec)</label>
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
              💡 秘密鍵はnsec1で始まる63文字の文字列です
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setStep('choose')}
          >
            戻る
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleImport}
            disabled={!importInput.trim()}
          >
            ログイン
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold">Nostr へようこそ</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          分散型ソーシャルネットワークを始めましょう
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
              <h3 className="text-xl font-semibold mb-2">新しい鍵を生成</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                初めての方はこちら。新しいNostrアカウントを作成します。
              </p>
              <div className="mt-3 text-xs text-purple-600 dark:text-purple-400 font-medium">
                推奨 →
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
              <h3 className="text-xl font-semibold mb-2">既存の鍵でログイン</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                すでにNostr鍵をお持ちの方はこちらから。
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={handleNip07}
          className="group relative p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl hover:border-gray-400 dark:hover:border-gray-600 transition-all text-left"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
              <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">NIP-07 拡張機能を使用</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Alby、nos2x等のブラウザ拡張機能で接続します。
              </p>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                ※ 開発中
              </div>
            </div>
          </div>
        </button>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-3">Nostrとは？</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>• 分散型の検閲耐性のあるソーシャルネットワーク</li>
          <li>• あなたのデータはあなたが管理します</li>
          <li>• 中央集権的な管理者は存在しません</li>
          <li>• 秘密鍵が唯一のログイン手段です</li>
        </ul>
      </div>
    </div>
  );
}