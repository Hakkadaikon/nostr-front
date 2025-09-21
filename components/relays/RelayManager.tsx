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

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input placeholder="wss://..." value={url} onChange={e => setUrl(e.target.value)} />
        <Button onClick={() => { if (url.trim()) { add(url.trim()); setUrl(''); } }}>Add</Button>
      </div>
      <ul className="space-y-2">
        {relays.map(r => (
          <li key={r.url} className="flex items-center justify-between rounded border p-2">
            <div className="truncate">{r.url}</div>
            <div className="flex items-center gap-2 text-sm">
              <label>
                <input type="checkbox" checked={r.read} onChange={() => toggleRead(r.url)} /> Read
              </label>
              <label>
                <input type="checkbox" checked={r.write} onChange={() => toggleWrite(r.url)} /> Write
              </label>
              <Button onClick={() => remove(r.url)}>Remove</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
