"use client";

import { Tweet } from 'react-tweet';
import { ExternalLink } from 'lucide-react';

interface XEmbedProps {
  statusId: string;
  url: string;
}

export function XEmbed({ statusId, url }: XEmbedProps) {
  return (
    <div className="mt-3">
      <div data-theme="dark" className="flex justify-center">
        <Tweet id={statusId} />
      </div>

      {/* Fallback link */}
      <div className="mt-2 flex justify-end">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <span>Xで見る</span>
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
