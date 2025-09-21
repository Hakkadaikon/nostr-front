"use client";

import { useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions {
  target: React.RefObject<HTMLElement>;
  onIntersect: () => void;
  enabled?: boolean;
  threshold?: number;
  rootMargin?: string;
}

/**
 * 無限スクロールを実装するためのカスタムフック
 */
export function useInfiniteScroll({
  target,
  onIntersect,
  enabled = true,
  threshold = 0.1,
  rootMargin = '100px',
}: UseInfiniteScrollOptions) {
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!enabled || !target.current) {
      return;
    }

    // オブザーバーの作成
    observer.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          onIntersect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    // ターゲット要素の監視を開始
    const currentTarget = target.current;
    observer.current.observe(currentTarget);

    // クリーンアップ
    return () => {
      if (observer.current && currentTarget) {
        observer.current.unobserve(currentTarget);
      }
    };
  }, [target, onIntersect, enabled, threshold, rootMargin]);

  return observer.current;
}