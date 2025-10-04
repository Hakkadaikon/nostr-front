"use client";

import { useState } from 'react';
import { Play } from 'lucide-react';

interface TwitchEmbedProps {
  embedUrl: string;
  url: string;
  type: 'video' | 'clip';
}

export function TwitchEmbed({ embedUrl, url, type }: TwitchEmbedProps) {
  const [showEmbed, setShowEmbed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = () => {
    setIsLoading(true);
    setShowEmbed(true);
  };

  if (!showEmbed) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-purple-900/20 group cursor-pointer max-w-full shadow-lg hover:shadow-xl transition-shadow duration-300"
        onClick={handlePlay}
      >
        <div className="relative aspect-video flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="relative z-10">
            <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-2xl group-hover:bg-purple-700">
              <Play className="w-10 h-10 text-white ml-1" fill="currentColor" />
            </div>
          </div>
          <div className="absolute top-2 left-2 px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-full flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
            </svg>
            <span>Twitch {type === 'clip' ? 'Clip' : 'Video'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-black max-w-full shadow-lg">
      <div className="relative aspect-video">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
            <div className="text-white">読み込み中...</div>
          </div>
        )}
        <iframe
          src={embedUrl}
          title="Twitch player"
          allow="autoplay; fullscreen"
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
