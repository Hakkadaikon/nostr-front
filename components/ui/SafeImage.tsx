"use client";

import { useState } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
}

export function SafeImage({ 
  src, 
  alt, 
  width, 
  height, 
  fill, 
  className = '', 
  priority = false 
}: SafeImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  // 画像URLの検証（XSS対策）
  const isValidImageUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
    } catch {
      return false;
    }
  };

  const handleError = () => {
    setImageError(true);
    // デフォルト画像にフォールバック
    setImageSrc('/images/default-avatar.png');
  };

  if (!isValidImageUrl(src)) {
    return null;
  }

  if (fill) {
    return (
      <img
        src={imageSrc}
        alt={alt}
        className={className}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        style={{
          position: 'absolute',
          height: '100%',
          width: '100%',
          inset: 0,
          objectFit: 'cover',
        }}
      />
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      loading={priority ? 'eager' : 'lazy'}
    />
  );
}