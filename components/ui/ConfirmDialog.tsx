import { useState } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '確認',
  cancelText = 'キャンセル',
  variant = 'warning',
  loading = false
}: ConfirmDialogProps) {
  const getIcon = () => {
    return <AlertTriangle className="w-6 h-6 text-red-500" />;
  };

  const getConfirmVariant = () => {
    switch (variant) {
      case 'danger':
        return 'danger';
      case 'warning':
        return 'danger';
      default:
        return 'primary';
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 whitespace-pre-line leading-relaxed">
              {message}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2"
              >
                {cancelText}
              </Button>
              <Button
                variant={getConfirmVariant()}
                onClick={onConfirm}
                disabled={loading}
                className="px-4 py-2"
              >
                {loading ? '実行中...' : confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}