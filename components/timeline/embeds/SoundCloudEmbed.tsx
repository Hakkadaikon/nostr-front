"use client";

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SoundCloudEmbedProps {
  embedUrl: string;
  url: string;
}

export function SoundCloudEmbed({ embedUrl, url }: SoundCloudEmbedProps) {
  const { t } = useTranslation();
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    return (
      <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.9 16.2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-5c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1s1-.4 1-1v-2c0-.6-.4-1-1-1zm3-4c-.6 0-1 .4-1 1v6c0 .6.4 1 1 1s1-.4 1-1v-6c0-.6-.4-1-1-1zm3 1c-.6 0-1 .4-1 1v4c0 .6.4 1 1 1s1-.4 1-1v-4c0-.6-.4-1-1-1zm3-4c-.6 0-1 .4-1 1v10c0 .6.4 1 1 1s1-.4 1-1v-10c0-.6-.4-1-1-1zm3 5c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1s1-.4 1-1v-2c0-.6-.4-1-1-1zm3 0c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1s1-.4 1-1v-2c0-.6-.4-1-1-1z"/>
            </svg>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('embeds.soundcloud.loadFailed')}
            </span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300"
          >
            <span>{t('embeds.soundcloud.listenOn')}</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
      {isLoading && (
        <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900/50" style={{ height: 166 }}>
          <div className="animate-pulse flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.9 16.2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-5c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1s1-.4 1-1v-2c0-.6-.4-1-1-1zm3-4c-.6 0-1 .4-1 1v6c0 .6.4 1 1 1s1-.4 1-1v-6c0-.6-.4-1-1-1zm3 1c-.6 0-1 .4-1 1v4c0 .6.4 1 1 1s1-.4 1-1v-4c0-.6-.4-1-1-1zm3-4c-.6 0-1 .4-1 1v10c0 .6.4 1 1 1s1-.4 1-1v-10c0-.6-.4-1-1-1zm3 5c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1s1-.4 1-1v-2c0-.6-.4-1-1-1zm3 0c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1s1-.4 1-1v-2c0-.6-.4-1-1-1z"/>
            </svg>
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</span>
          </div>
        </div>
      )}
      <iframe
        src={embedUrl}
        width="100%"
        height="166"
        frameBorder="0"
        allow="autoplay"
        title="SoundCloud player"
        loading="lazy"
        sandbox="allow-same-origin allow-scripts allow-popups"
        className={`w-full${isLoading ? ' hidden' : ''}`}
        onLoad={() => {
          setIsLoading(false);
          setHasError(false);
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-900 text-center"
      >
        Listen on SoundCloud →
      </a>
    </div>
  );
}
