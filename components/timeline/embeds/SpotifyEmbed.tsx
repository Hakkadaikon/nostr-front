"use client";

interface SpotifyEmbedProps {
  embedUrl: string;
  url: string;
}

export function SpotifyEmbed({ embedUrl, url }: SpotifyEmbedProps) {
  const isTrack = embedUrl.includes('/track/');
  const height = isTrack ? 152 : 380;

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
      <iframe
        src={embedUrl}
        width="100%"
        height={height}
        frameBorder="0"
        allowTransparency={true}
        allow="encrypted-media"
        title="Spotify player"
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
        Listen on Spotify →
      </a>
    </div>
  );
}