"use client";

import { useState, useRef } from 'react';
import { Image, X, AlertCircle } from 'lucide-react';
import { isValidMimeType } from '../../lib/utils/security';

interface SecureMediaUploaderProps {
  onMediaSelect: (files: File[]) => void;
  disabled?: boolean;
  selectedMedia: File[];
  onRemoveMedia: (index: number) => void;
  hidePreview?: boolean;
}

// 許可するMIMEタイプ
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 4;

export function SecureMediaUploader({
  onMediaSelect,
  disabled = false,
  selectedMedia,
  onRemoveMedia,
  hidePreview = false
}: SecureMediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string>('');

  const validateFiles = (files: File[]): { valid: File[], errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // MIMEタイプチェック
      if (!isValidMimeType(file.type, ALLOWED_MIME_TYPES)) {
        errors.push(`${file.name}: サポートされていないファイル形式です`);
        continue;
      }

      // ファイルサイズチェック
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: ファイルサイズが大きすぎます（最大10MB）`);
        continue;
      }

      // ファイル名の検証
      if (!/^[\w\-. ]+$/.test(file.name)) {
        errors.push(`${file.name}: 無効なファイル名です`);
        continue;
      }

      valid.push(file);
    }

    return { valid, errors };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const files = Array.from(e.target.files || []);
    
    if (files.length + selectedMedia.length > MAX_FILES) {
      setUploadError(`最大${MAX_FILES}個のファイルまでアップロード可能です`);
      return;
    }

    const { valid, errors } = validateFiles(files);
    
    if (errors.length > 0) {
      setUploadError(errors.join('\n'));
    }
    
    if (valid.length > 0) {
      onMediaSelect([...selectedMedia, ...valid]);
    }

    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(',')}
        multiple
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
        id="media-upload"
      />
      
      <label
        htmlFor="media-upload"
        className={`inline-flex items-center gap-2 p-2 rounded-full transition-all duration-200 ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-purple-50 dark:hover:bg-purple-950/20 text-purple-500 hover:scale-110 cursor-pointer'
        }`}
        aria-label="画像をアップロード"
      >
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image size={20} aria-hidden="true" />
      </label>

      {uploadError && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm whitespace-pre-line">{uploadError}</p>
          </div>
        </div>
      )}

      {!hidePreview && selectedMedia.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {selectedMedia.map((file, index) => (
            <div key={index} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(file)}
                alt={`アップロード画像 ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
                onLoad={(e) => {
                  // メモリリークを防ぐ
                  URL.revokeObjectURL((e.target as HTMLImageElement).src);
                }}
              />
              <button
                onClick={() => onRemoveMedia(index)}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                type="button"
                disabled={disabled}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}