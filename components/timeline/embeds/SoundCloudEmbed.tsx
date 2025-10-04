"use client";

interface SoundCloudEmbedProps {
  embedUrl: string;
  url: string;
}

export function SoundCloudEmbed({ embedUrl, url }: SoundCloudEmbedProps) {
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
      <iframe
        src={embedUrl}
        width="100%"
        height="166"
        frameBorder="0"
        allow="autoplay"
        title="SoundCloud player"
        loading="lazy"
        sandbox="allow-same-origin allow-scripts allow-popups"
        className="w-full"
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
