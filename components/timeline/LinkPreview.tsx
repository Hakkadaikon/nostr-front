"use client";

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Spinner } from '../ui/Spinner';

interface LinkPreviewData {
  url?: string;
  title?: string;
  description?: string;
  siteName?: string;
  image?: string;
}

interface LinkPreviewProps {
  url: string;
}

const cache = new Map<string, LinkPreviewData | null>();

function sanitizeUrl(url: string) {
  try {
    return new URL(url).toString();
  } catch {
    return null;
  }
}

export function LinkPreview({ url }: LinkPreviewProps) {
  const normalizedUrl = useMemo(() => sanitizeUrl(url), [url]);
  const cacheKey = normalizedUrl ?? url;
  const [data, setData] = useState<LinkPreviewData | null | undefined>(cache.get(cacheKey));
  const [loading, setLoading] = useState(!cache.has(cacheKey));

  useEffect(() => {
    if (!normalizedUrl) {
      setData(null);
      setLoading(false);
      return;
    }

    if (cache.has(cacheKey)) {
      setData(cache.get(cacheKey) ?? null);
      setLoading(false);
      return;
    }

    const previewUrl = normalizedUrl as string;
    let cancelled = false;

    async function loadPreview() {
      try {
        setLoading(true);
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(previewUrl)}`);
        if (!res.ok) throw new Error('Failed to fetch preview');
        const json = (await res.json()) as LinkPreviewData;
        if (!cancelled) {
          cache.set(cacheKey, json);
          setData(json);
        }
      } catch (error) {
        if (!cancelled) {
          cache.set(cacheKey, null);
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, normalizedUrl]);

  if (!normalizedUrl) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center text-purple-600 underline hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-200"
      >
        {url}
      </a>
    );
  }

  const title = data?.title || normalizedUrl;
  const description = data?.description;
  const image = data?.image;
  const siteName = data?.siteName || new URL(normalizedUrl as string).hostname;

  return (
    <a
      href={normalizedUrl as string}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="flex flex-col sm:flex-row">
        {image ? (
          <div className="relative h-40 w-full flex-shrink-0 sm:h-40 sm:w-48">
            <Image
              src={image}
              alt={title || 'Link preview'}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 192px"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-24 w-full flex-shrink-0 items-center justify-center bg-purple-100 text-sm font-semibold text-purple-600 dark:bg-purple-900/30 dark:text-purple-300 sm:h-40 sm:w-48">
            {siteName}
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2 px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-300">
            {siteName}
          </div>
          <div className="text-base font-semibold text-gray-900 dark:text-white">
            {title}
          </div>
          {description && (
            <div className="text-sm text-gray-600 line-clamp-3 dark:text-gray-300">
              {description}
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Spinner size="small" />
              <span>プレビューを取得中...</span>
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
