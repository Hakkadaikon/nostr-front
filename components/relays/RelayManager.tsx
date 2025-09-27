"use client";
import { useRelaysStore } from '../../stores/relays.store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function RelayManager() {
  const [url, setUrl] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [relayToDelete, setRelayToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const relays = useRelaysStore(s => s.relays);
  const add = useRelaysStore(s => s.add);
  const remove = useRelaysStore(s => s.remove);
  const toggleRead = useRelaysStore(s => s.toggleRead);
  const toggleWrite = useRelaysStore(s => s.toggleWrite);
  const toggleNip50 = useRelaysStore(s => s.toggleNip50);

  const handleDeleteClick = (relayUrl: string) => {
    setRelayToDelete(relayUrl);
    setDeleteConfirmOpen(true);
  };

  const isLastActiveRelay = (relayUrl: string) => {
    const activeRelays = relays.filter(r => (r.read || r.write));
    return activeRelays.length === 1 && activeRelays[0].url === relayUrl;
  };

  const handleDeleteConfirm = async () => {
    if (!relayToDelete) return;
    
    setIsDeleting(true);
    try {
      // 少し遅延を加えて削除の重要性を示す
      await new Promise(resolve => setTimeout(resolve, 500));
      remove(relayToDelete);
      setDeleteConfirmOpen(false);
      setRelayToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (isDeleting) return; // 削除中はキャンセルできない
    setDeleteConfirmOpen(false);
    setRelayToDelete(null);
  };

  const getDeleteMessage = (relayUrl: string) => {
    const relay = relays.find(r => r.url === relayUrl);
    if (!relay) return `「${relayUrl}」を削除しますか？`;

    const capabilities = [];
    if (relay.read) capabilities.push('読み取り');
    if (relay.write) capabilities.push('書き込み');
    if (relay.nip50) capabilities.push('検索');
    
    const capabilityText = capabilities.length > 0 
      ? `（${capabilities.join('・')}機能が有効）` 
      : '';

    // 最後のアクティブリレーかどうかをチェック
    if (isLastActiveRelay(relayUrl)) {
      return `「${relayUrl}」${capabilityText}を削除すると、アクティブなリレーがなくなります。\n\n⚠️ 危険: これにより投稿の送受信ができなくなり、アプリケーションが正常に動作しなくなる可能性があります。\n\n削除する前に他のリレーを追加することを強く推奨します。本当に削除しますか？`;
    }

    // アクティブなリレーの数をチェック
    const activeRelaysCount = relays.filter(r => r.read || r.write).length;
    const lowRelayWarning = activeRelaysCount <= 2 
      ? '\n⚠️ 警告: アクティブなリレーが少なくなります。接続性や投稿の可視性に影響する可能性があります。' 
      : '';
    
    return `「${relayUrl}」${capabilityText}を削除すると、このリレーとの接続が切断されます。投稿の送信や取得ができなくなる可能性があります。${lowRelayWarning}\n\nこの操作は取り消すことができません。本当に削除しますか？`;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <div className="flex gap-3">
          <Input 
            placeholder="wss://..." 
            value={url} 
            onChange={e => setUrl(e.target.value)} 
            className="flex-1"
          />
          <Button 
            onClick={() => { if (url.trim()) { add(url.trim()); setUrl(''); } }}
            className="whitespace-nowrap px-6"
          >
            追加
          </Button>
        </div>
        
        <div className="space-y-3">
          {relays.map(r => (
            <div key={r.url} className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 p-4 gap-3 bg-gray-50 dark:bg-gray-900/30 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
              <div className="text-sm sm:text-base font-mono bg-white dark:bg-gray-800 px-3 py-2 rounded-lg break-all">
                {r.url}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4 text-sm flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                    <input type="checkbox" checked={r.read} onChange={() => toggleRead(r.url)} className="cursor-pointer w-4 h-4 rounded" />
                    <span className="font-medium whitespace-nowrap">Read</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                    <input type="checkbox" checked={r.write} onChange={() => toggleWrite(r.url)} className="cursor-pointer w-4 h-4 rounded" />
                    <span className="font-medium whitespace-nowrap">Write</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-purple-600 dark:text-purple-400">
                    <input type="checkbox" checked={r.nip50 || false} onChange={() => toggleNip50(r.url)} className="cursor-pointer w-4 h-4 rounded" />
                    <span className="font-medium whitespace-nowrap">Search</span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleDeleteClick(r.url)}
                    variant="secondary"
                    className={`whitespace-nowrap text-xs px-3 py-2 w-full sm:w-auto flex items-center gap-2 transition-all group ${
                      isLastActiveRelay(r.url)
                        ? 'border-orange-300 dark:border-orange-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-400 dark:hover:bg-orange-900/20 dark:hover:text-orange-400 dark:hover:border-orange-500' 
                        : 'border-gray-300 dark:border-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-700'
                    }`}
                  >
                    <Trash2 size={14} className="group-hover:animate-pulse" />
                    削除
                    {isLastActiveRelay(r.url) && (
                      <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-1 rounded">
                        注意
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
            <strong className="font-semibold">ヒント:</strong> Searchにチェックを入れたリレーは検索機能で使用されます。複数のリレーを選択できます。
          </p>
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="リレーを削除しますか？"
        message={relayToDelete ? getDeleteMessage(relayToDelete) : ''}
        confirmText="削除する"
        cancelText="キャンセル"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
