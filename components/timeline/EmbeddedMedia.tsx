"use client";

import Image from 'next/image';

interface EmbeddedMediaProps {
  url: string;
  alt?: string;
}

export function EmbeddedImage({ url, alt }: EmbeddedMediaProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 block overflow-hidden rounded-2xl border border-gray-200 bg-black/5 dark:border-gray-700 dark:bg-gray-900/40"
    >
      <div className="relative h-64 w-full">
        <Image
          src={url}
          alt={alt || 'Embedded media'}
          fill
          className="object-contain bg-black/80"
          sizes="(max-width: 768px) 100vw, 640px"
          unoptimized
        />
      </div>
    </a>
  );
}
