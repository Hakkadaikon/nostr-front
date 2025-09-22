"use client";

import { useState } from 'react';
import { Play, Youtube } from 'lucide-react';
import { SafeImage } from '../../ui/SafeImage';

interface YouTubeEmbedProps {
  videoId: string;
  url: string;
}

export function YouTubeEmbed({ videoId, url }: YouTubeEmbedProps) {
  const [showEmbed, setShowEmbed] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 複数の画質のサムネイルを試す
  const thumbnailUrls = [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
  ];
  
  const currentThumbnail = thumbnailError ? thumbnailUrls[1] : thumbnailUrls[0];
  
  const handlePlay = () => {
    setIsLoading(true);
    setShowEmbed(true);
  };

  if (!showEmbed) {
    return (
      <div className="my-4 relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-black group cursor-pointer max-w-full shadow-lg hover:shadow-xl transition-shadow duration-300"
           onClick={handlePlay}>
        <div className="relative aspect-video">
          <SafeImage
            src={currentThumbnail}
            alt="YouTube video thumbnail"
            fill
            className="object-cover"
            onError={() => setThumbnailError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-2xl group-hover:bg-red-700">
                <Play className="w-10 h-10 text-white ml-1" fill="currentColor" />
              </div>
              <div className="absolute inset-0 bg-white/20 rounded-2xl animate-ping" />
            </div>
          </div>
          <div className="absolute top-2 left-2 px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-full flex items-center gap-1">
            <Youtube size={14} />
            <span>YouTube</span>
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
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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