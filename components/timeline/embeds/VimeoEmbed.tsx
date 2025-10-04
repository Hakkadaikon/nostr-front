"use client";

import { useState } from 'react';
import { Play } from 'lucide-react';

interface VimeoEmbedProps {
  videoId: string;
  url: string;
}

export function VimeoEmbed({ videoId, url }: VimeoEmbedProps) {
  const [showEmbed, setShowEmbed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = () => {
    setIsLoading(true);
    setShowEmbed(true);
  };

  if (!showEmbed) {
    return (
      <div
        className="my-4 relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 group cursor-pointer max-w-full shadow-lg hover:shadow-xl transition-shadow duration-300"
        onClick={handlePlay}
      >
        <div className="relative aspect-video flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="relative z-10">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-2xl group-hover:bg-blue-700">
              <Play className="w-10 h-10 text-white ml-1" fill="currentColor" />
            </div>
          </div>
          <div className="absolute top-2 left-2 px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-full flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797z"/>
            </svg>
            <span>Vimeo</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-black max-w-full shadow-lg">
      <div className="relative aspect-video">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
            <div className="text-white">読み込み中...</div>
          </div>
        )}
        <iframe
          src={`https://player.vimeo.com/video/${videoId}?autoplay=1&color=5865F2&title=0&byline=0&portrait=0`}
          title="Vimeo video player"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-forms"
        />
      </div>
    </div>
  );
}
