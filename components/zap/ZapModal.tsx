"use client";

import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Zap, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { generateZapInvoice, DEFAULT_TEST_LN_ADDRESS } from '../../features/zap/services/zap';
import { useAuthStore } from '../../stores/auth.store';
import { useTranslation } from 'react-i18next';

interface ZapModalProps {
  isOpen: boolean;
  onClose: () => void;
  tweetId: string;
  recipientNpub: string;
  recipientLnAddress?: string;
}

export function ZapModal({ isOpen, onClose, tweetId, recipientNpub, recipientLnAddress }: ZapModalProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('1');
  const [message, setMessage] = useState('');
  const [invoice, setInvoice] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [usedLnAddress, setUsedLnAddress] = useState('');

  const npub = useAuthStore((state) => state.npub);

  // Generate QR code when invoice changes
  useEffect(() => {
    if (invoice) {
      QRCode.toDataURL(invoice.toUpperCase(), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'L'
      })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('Error generating QR code:', err));
    }
  }, [invoice]);

  const handleGenerateInvoice = async () => {
    setError('');
    setIsGenerating(true);

    try {
      // Lightning Addressを決定（受信者のアドレスがない場合はテスト用アドレス）
      const lnAddress = recipientLnAddress || DEFAULT_TEST_LN_ADDRESS;
      setUsedLnAddress(lnAddress);
      
      // インボイスを生成
      const generatedInvoice = await generateZapInvoice({
        recipientNpub: recipientNpub || npub || 'npub1qqs9wzk7c5sat3lw20t9g8xqcznl54rufa6ckzuuzh66t4vywpazq6fq2z9', // テスト用npub
        recipientLnAddress: lnAddress,
        amountSats: parseInt(amount),
        message: message || undefined,
        eventId: tweetId,
      });
      
      setInvoice(generatedInvoice);
    } catch (err: any) {
      console.error('Failed to generate invoice:', err);
      setError(err.message || t('zap.errors.invoiceFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setAmount('1');
    setMessage('');
    setInvoice('');
    setError('');
    setQrCodeDataUrl('');
    setUsedLnAddress('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="text-yellow-500" size={24} />
          <h2 className="text-xl font-bold">Lightning Zap</h2>
        </div>

        {!invoice ? (
          <>
            {/* Lightning Address情報 */}
            {!recipientLnAddress && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-amber-600 dark:text-amber-400 mt-0.5" size={16} />
                  <div>
                    <p className="text-amber-800 dark:text-amber-200 font-medium">{t('zap.testMode')}</p>
                    <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                      {t('zap.testModeDescription', { address: DEFAULT_TEST_LN_ADDRESS })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="amount" className="block text-sm font-medium mb-1">
                {t('zap.amountLabel')}
              </label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                placeholder="1"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1">
                {t('zap.messageLabel')}
              </label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('zap.messagePlaceholder')}
                rows={3}
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-red-600 dark:text-red-400 mt-0.5" size={16} />
                  <div className="text-red-700 dark:text-red-300 text-sm">{error}</div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button onClick={handleClose} variant="secondary">
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleGenerateInvoice}
                disabled={!amount || parseInt(amount) < 1 || isGenerating}
              >
                {isGenerating ? <Spinner /> : t('zap.generateInvoice')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                {t('zap.invoiceGenerated')}
              </p>

              <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                {t('zap.sendTo', { address: usedLnAddress })}
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div id="qr-code" className="flex items-center justify-center">
                  {qrCodeDataUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrCodeDataUrl} alt="Lightning Invoice QR Code" className="max-w-full h-auto" />
                    </>
                  ) : (
                    <div className="h-64 w-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                      <Spinner />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">{t('zap.invoiceLabel')}</p>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs break-all font-mono select-all">
                  {invoice}
                </div>
              </div>

              <div className="flex justify-center gap-2">
                <Button
                  onClick={() => navigator.clipboard.writeText(invoice)}
                  variant="secondary"
                >
                  {t('zap.copyButton')}
                </Button>
                <Button onClick={handleReset}>
                  {t('zap.newInvoice')}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}