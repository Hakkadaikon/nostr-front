"use client";
import { useRelaysStore } from '../../stores/relays.store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useState } from 'react';

export default function RelayManager() {
  const [url, setUrl] = useState('');
  const relays = useRelaysStore(s => s.relays);
  const add = useRelaysStore(s => s.add);
  const remove = useRelaysStore(s => s.remove);
  const toggleRead = useRelaysStore(s => s.toggleRead);
  const toggleWrite = useRelaysStore(s => s.toggleWrite);
  const toggleNip50 = useRelaysStore(s => s.toggleNip50);

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
            <div key={r.url} className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 p-4 gap-3 bg-gray-50 dark:bg-gray-900/30">
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
                <Button
                  onClick={() => remove(r.url)}
                  variant="danger"
                  className="whitespace-nowrap text-xs px-4 py-2 w-full sm:w-auto"
                >
                  削除
                </Button>
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
    </div>
  );
}
