"use client";

import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { loadTikTokScript } from '../../../lib/utils/external-scripts';

interface TikTokEmbedProps {
  url: string;
}

declare global {
  interface Window {
    tiktokEmbed?: {
      lib?: {
        render: (element: HTMLElement) => void;
      };
    };
  }
}

export function TikTokEmbed({ url }: TikTokEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadEmbed = async () => {
      if (!containerRef.current) return;

      try {
        setIsLoading(true);
        setHasError(false);

        await loadTikTokScript();

        if (!isMounted) return;

        // Clear container
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Create blockquote element for TikTok embed
        const blockquote = document.createElement('blockquote');
        blockquote.className = 'tiktok-embed';
        blockquote.setAttribute('cite', url);
        blockquote.setAttribute('data-video-id', url.split('/').pop() || '');
        blockquote.style.maxWidth = '605px';
        blockquote.style.minWidth = '325px';

        if (containerRef.current) {
          containerRef.current.appendChild(blockquote);
        }

        // Render TikTok embed
        if (window.tiktokEmbed?.lib && containerRef.current) {
          window.tiktokEmbed.lib.render(containerRef.current);
        }

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[TikTokEmbed] Error loading embed:', error);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      loadEmbed();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [url]);

  if (hasError) {
    return (
      <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              TikTok動画を読み込めませんでした
            </span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <span>TikTokで見る</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      {isLoading && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-pulse flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">読み込み中...</span>
            </div>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className={`tiktok-embed-container${isLoading ? ' hidden' : ''}`}
      />
    </div>
  );
}
