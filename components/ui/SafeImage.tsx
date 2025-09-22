"use client";

import NextImage from 'next/image';
import { useEffect, useState } from 'react';

const DEFAULT_FALLBACK_SRC = '/images/default-avatar.svg';

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  unoptimized?: boolean;
  fallbackSrc?: string;
  onError?: () => void;
}

export function SafeImage({
  src,
  alt,
  width,
  height,
  fill,
  className = '',
  priority = false,
  sizes,
  unoptimized,
  fallbackSrc,
  onError,
}: SafeImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    setImageSrc(src);
    setImageError(false);
  }, [src]);

  const isValidImageUrl = (url: string) => {
    if (url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')) {
      return true;
    }

    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
    } catch {
      return false;
    }
  };

  const effectiveFallback = fallbackSrc || DEFAULT_FALLBACK_SRC;

  if (!isValidImageUrl(src) && !imageError) {
    setImageError(true);
    if (effectiveFallback) {
      setImageSrc(effectiveFallback);
    } else {
      return null;
    }
  }

  if (!fill && (typeof width !== 'number' || typeof height !== 'number')) {
    return null;
  }

  const handleError = () => {
    if (!imageError) {
      setImageError(true);
      if (effectiveFallback && imageSrc !== effectiveFallback) {
        setImageSrc(effectiveFallback);
      }
    }

    onError?.();
  };

  const resolvedSizes = fill ? sizes ?? '100vw' : sizes;
  const shouldUnoptimize = unoptimized ?? true;

  // 画像URLが空またはエラーでfallbackもない場合は何も表示しない
  if ((!imageSrc || imageSrc === '') && !effectiveFallback) {
    return null;
  }

  return (
    <NextImage
      src={imageSrc || effectiveFallback}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      className={className}
      priority={priority}
      sizes={resolvedSizes}
      unoptimized={shouldUnoptimize}
      onError={handleError}
    />
  );
}
