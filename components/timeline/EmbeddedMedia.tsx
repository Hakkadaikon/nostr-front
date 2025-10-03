"use client";

interface EmbeddedMediaProps {
  url: string;
  alt?: string;
}

export function EmbeddedImage({ url, alt }: EmbeddedMediaProps) {
  return (
    <div className="mt-3 block overflow-hidden rounded-2xl border border-gray-200 bg-black/5 dark:border-gray-700 dark:bg-gray-900/40">
      <div className="relative h-64 w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt || 'Embedded media'}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain bg-black/80"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
