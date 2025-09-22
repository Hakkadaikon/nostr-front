"use client";

import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface XEmbedProps {
  statusId: string;
  url: string;
}

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => void;
        createTweet: (
          tweetId: string,
          targetEl: HTMLElement,
          options?: Record<string, any>
        ) => Promise<HTMLElement>;
      };
    };
  }
}

export function XEmbed({ statusId, url }: XEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadTweet = async () => {
      if (!containerRef.current || !statusId) return;

      try {
        setIsLoading(true);
        setHasError(false);

        // Load Twitter widget script if not already loaded
        if (!window.twttr?.widgets) {
          await new Promise<void>((resolve, reject) => {
            // タイムアウト設定（10秒）
            const timeout = setTimeout(() => {
              reject(new Error('Twitter script load timeout'));
            }, 10000);

            const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]');
            
            if (existingScript) {
              // Script already exists, wait for it to load
              if (window.twttr?.widgets) {
                clearTimeout(timeout);
                resolve();
              } else {
                const handleLoad = () => {
                  clearTimeout(timeout);
                  resolve();
                };
                const handleError = () => {
                  clearTimeout(timeout);
                  reject(new Error('Failed to load Twitter script'));
                };
                existingScript.addEventListener('load', handleLoad);
                existingScript.addEventListener('error', handleError);
              }
              return;
            }

            const script = document.createElement('script');
            script.src = 'https://platform.twitter.com/widgets.js';
            script.async = true;
            script.charset = 'utf-8';
            script.onload = () => {
              clearTimeout(timeout);
              // widgets.jsがロードされても即座にtwttr.widgetsが利用可能にならない場合があるため、少し待つ
              timeoutId = setTimeout(() => {
                if (window.twttr?.widgets) {
                  resolve();
                } else {
                  reject(new Error('Twitter widgets not available'));
                }
              }, 100);
            };
            script.onerror = () => {
              clearTimeout(timeout);
              reject(new Error('Failed to load Twitter script'));
            };
            document.head.appendChild(script);
          });
        }

        // Clear container
        if (containerRef.current && isMounted) {
          containerRef.current.innerHTML = '';
        }

        // Create tweet embed
        if (window.twttr?.widgets && containerRef.current && isMounted) {
          // Check theme from localStorage or system preference
          const theme = localStorage.getItem('theme') === 'dark' || 
                       (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches) 
                       ? 'dark' : 'light';
          
          const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
          const isSmallScreen = viewportWidth < 640;
          const calculatedWidth = isSmallScreen
            ? Math.max(Math.min(viewportWidth - 32, 540), 250)
            : 550;

          const tweetElement = await window.twttr.widgets.createTweet(
            statusId,
            containerRef.current,
            {
              theme,
              dnt: false, // Do Not Trackを無効にして、メディアの読み込みを許可
              conversation: 'none',
              align: 'center',
              width: calculatedWidth,
              cards: 'visible', // メディアカードを表示
              linkColor: theme === 'dark' ? '#8B5CF6' : '#7C3AED',
            }
          );

          if (tweetElement && isMounted) {
            setIsLoading(false);
            setHasError(false);
          } else if (isMounted) {
            // ツイートが見つからない、削除された、または非公開の場合
            setHasError(true);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Error loading tweet:', error);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    // 少し遅延させてから読み込み開始（レンダリングの安定化のため）
    timeoutId = setTimeout(() => {
      loadTweet();
    }, 50);

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [statusId]);

  // Fallback UI
  if (hasError) {
    return (
      <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              ポストを読み込めませんでした
            </span>
          </div>
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

  return (
    <div className="mt-3">
      {isLoading && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-pulse flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">読み込み中...</span>
            </div>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className={`twitter-embed${isLoading ? ' hidden' : ''}`}
      />
    </div>
  );
}
