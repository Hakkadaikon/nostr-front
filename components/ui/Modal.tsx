import { ReactNode } from 'react';

export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40" role="dialog" aria-modal>
      <div className="w-full max-w-md rounded bg-white p-4 text-gray-900 shadow dark:bg-gray-900 dark:text-gray-100">
        {children}
        <div className="mt-4 text-right">
          <button className="rounded border px-3 py-1" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
