import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, children, size = 'md' }: ModalProps) {
  if (!open) return null;
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40" role="dialog" aria-modal>
      <div className={`w-full ${sizeClasses[size]} rounded bg-white p-6 text-gray-900 shadow-lg dark:bg-gray-900 dark:text-gray-100`}>
        {children}
      </div>
    </div>
  );
}
