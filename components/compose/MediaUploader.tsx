"use client";

import { useState, useRef } from 'react';
import { Image, X, Upload, Film } from 'lucide-react';

interface MediaUploaderProps {
  onMediaSelect: (files: File[]) => void;
  disabled?: boolean;
  selectedMedia: File[];
  onRemoveMedia: (index: number) => void;
}

export function MediaUploader({ 
  onMediaSelect, 
  disabled, 
  selectedMedia,
  onRemoveMedia 
}: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const maxSize = 100 * 1024 * 1024; // 100MB
      return (isImage || isVideo) && file.size <= maxSize;
    });

    if (validFiles.length > 0) {
      onMediaSelect([...selectedMedia, ...validFiles]);
    }

    // リセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getMediaPreview = (file: File) => {
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');

    return (
      <div key={file.name} className="relative group">
        <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          {isVideo ? (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-12 h-12 text-gray-400" />
              <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                {file.name}
              </span>
            </div>
          ) : (
            <img
              src={url}
              alt={file.name}
              className="w-full h-full object-cover"
              onLoad={() => URL.revokeObjectURL(url)}
            />
          )}
        </div>
        
        {/* 削除ボタン */}
        <button
          onClick={() => {
            const index = selectedMedia.indexOf(file);
            if (index > -1) {
              onRemoveMedia(index);
            }
          }}
          className="absolute -top-2 -right-2 bg-gray-900 dark:bg-gray-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X size={16} />
        </button>
      </div>
    );
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* アップロードボタン */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || selectedMedia.length >= 4}
        className="p-2 rounded-full hover:bg-purple-50 dark:hover:bg-purple-950/20 text-purple-500 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
        title={selectedMedia.length >= 4 ? "最大4つまでです" : "画像・動画を追加"}
      >
        <Image size={20} />
      </button>

      {/* プレビューエリア */}
      {selectedMedia.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {selectedMedia.map((file) => getMediaPreview(file))}
        </div>
      )}
    </>
  );
}