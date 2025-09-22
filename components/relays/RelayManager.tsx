"use client";
import { useRelaysStore } from '../../stores/relays.store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useState } from 'react';

export default function RelayManager() {
  const [url, setUrl] = useState('');
  const [searchRelayUrl, setSearchRelayUrl] = useState('');
  const relays = useRelaysStore(s => s.relays);
  const searchRelay = useRelaysStore(s => s.searchRelay);
  const add = useRelaysStore(s => s.add);
  const remove = useRelaysStore(s => s.remove);
  const toggleRead = useRelaysStore(s => s.toggleRead);
  const toggleWrite = useRelaysStore(s => s.toggleWrite);
  const toggleNip50 = useRelaysStore(s => s.toggleNip50);
  const setSearchRelay = useRelaysStore(s => s.setSearchRelay);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-md font-medium">リレー一覧</h3>
        <div className="flex gap-2">
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
        <ul className="space-y-2">
          {relays.map(r => (
            <li key={r.url} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded border p-3 gap-2">
              <div className="truncate text-sm sm:text-base">{r.url}</div>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <label className="flex items-center gap-1 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400">
                  <input type="checkbox" checked={r.read} onChange={() => toggleRead(r.url)} className="cursor-pointer" /> 
                  <span>Read</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400">
                  <input type="checkbox" checked={r.write} onChange={() => toggleWrite(r.url)} className="cursor-pointer" /> 
                  <span>Write</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-purple-600 dark:text-purple-400">
                  <input type="checkbox" checked={r.nip50 || false} onChange={() => toggleNip50(r.url)} className="cursor-pointer" /> 
                  <span>NIP-50</span>
                </label>
                <Button
                  onClick={() => remove(r.url)}
                  variant="danger"
                  className="whitespace-nowrap text-xs px-3 py-1"
                >
                  削除
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3 border-t pt-4">
        <h3 className="text-md font-medium">検索専用リレー（NIP-50対応）</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          検索専用のNIP-50対応リレーを指定できます。指定しない場合は、上記でNIP-50にチェックしたリレーが使用されます。
        </p>
        <div className="flex gap-2">
          <Input 
            placeholder="wss://relay.nostr.band" 
            value={searchRelayUrl} 
            onChange={e => setSearchRelayUrl(e.target.value)} 
            className="flex-1"
          />
          <Button 
            onClick={() => { 
              if (searchRelayUrl.trim()) { 
                setSearchRelay(searchRelayUrl.trim()); 
                setSearchRelayUrl(''); 
              } 
            }}
            className="whitespace-nowrap px-6"
          >
            設定
          </Button>
        </div>
        {searchRelay && (
          <div className="flex items-center justify-between rounded bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-3">
            <div className="text-sm">
              <span className="text-purple-600 dark:text-purple-400 font-medium">検索リレー:</span> {searchRelay}
            </div>
            <Button
              onClick={() => setSearchRelay(null)}
              variant="danger"
              className="text-xs"
            >
              削除
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
