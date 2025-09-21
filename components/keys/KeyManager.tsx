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
  const { npub, nsec, locked } = useAuthStore();
  const loginWithNsec = useAuthStore(s => s.loginWithNsec);
  const lock = useAuthStore(s => s.lock);
  const unlock = useAuthStore(s => s.unlock);
  const logout = useAuthStore(s => s.logout);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button onClick={() => {
          const { npub, nsec } = generatePrivateKey();
          loginWithNsec(npub, nsec);
        }}>Generate</Button>
        <Button onClick={() => setConfirmOpen(true)}>Export nsec</Button>
        <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <div className="space-y-2">
            <p className="text-sm">Do not share your secret key. Are you sure you want to copy nsec to clipboard?</p>
            <div className="text-right">
              <Button onClick={async () => { if (!nsec) return; const exp = exportNsec(nsec); if (exp.ok) await navigator.clipboard.writeText(exp.nsec); setConfirmOpen(false); }}>Copy</Button>
            </div>
          </div>
        </Modal>
        {locked ? (
          <Button onClick={unlock}>Unlock</Button>
        ) : (
          <Button onClick={lock}>Lock</Button>
        )}
        <Button onClick={logout}>Logout</Button>
      </div>
      <div className="flex gap-2">
        <Input placeholder="nsec or hex" value={input} onChange={e => setInput(e.target.value)} />
        <Button onClick={() => {
          const r = importKey(input.trim());
          if (r.ok) loginWithNsec(r.npub, r.nsec);
        }}>Import</Button>
      </div>
      <div className="text-xs text-gray-500">
        <div>npub: <code>{npub || '-'}</code></div>
        <div>nsec: <code>{nsec ? '••••••' : '-'}</code></div>
        <p className="mt-2">Warning: Never share your nsec. Use NIP-07 when available.</p>
      </div>
    </div>
  );
}
