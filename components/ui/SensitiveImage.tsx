"use client";

import { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { isFollowing } from '../../lib/follow/isFollowing';
import { useImageRevealStore } from '../../stores/image-reveal.store';

interface SensitiveImageProps {
  src: string;
  alt: string;
  authorPubkey?: string;
  actorPubkey?: string; // アクター（いいね・リポスト等をした人）の公開鍵
  className?: string;
  children: React.ReactNode; // 実際の画像コンポーネント（img, SafeImage等）
}

/**
 * 非フォロワーの画像にぼかし処理を適用し、クリックで解除できるコンポーネント
 *
 * 動作:
 * - authorPubkey または actorPubkey がフォロー中の場合: ぼかしなしで表示
 * - どちらも非フォローの場合: 初回はぼかし、クリックで解除
 * - 両方未指定またはフォロー情報が取得できない場合: 安全側（ぼかす）
 */
export function SensitiveImage({
  src,
  alt,
  authorPubkey,
  actorPubkey,
  className = '',
  children,
}: SensitiveImageProps) {
  const [shouldBlur, setShouldBlur] = useState(true);
  const { isRevealed, revealImage } = useImageRevealStore();

  useEffect(() => {
    // 投稿者のフォロー判定
    const authorFollowStatus = isFollowing(authorPubkey);

    // アクター（いいね・リポスト等をした人）のフォロー判定
    const actorFollowStatus = isFollowing(actorPubkey);

    // デバッグログ
    console.log('[SensitiveImage] Debug:', {
      src: src.substring(0, 50),
      authorPubkey,
      authorFollowStatus,
      actorPubkey,
      actorFollowStatus,
      isRevealed: isRevealed(src)
    });

    // 投稿者またはアクターがフォロー中の場合はぼかしなし
    if (authorFollowStatus === true || actorFollowStatus === true) {
      setShouldBlur(false);
      return;
    }

    // 既に解除されている場合
    if (isRevealed(src)) {
      setShouldBlur(false);
      return;
    }

    // 非フォローまたは判定不能の場合はぼかす（安全側）
    setShouldBlur(true);
  }, [authorPubkey, actorPubkey, src, isRevealed]);

  const handleReveal = () => {
    revealImage(src);
    setShouldBlur(false);
  };

  // ぼかしが不要な場合は元の画像をそのまま表示
  if (!shouldBlur) {
    return <>{children}</>;
  }

  // ぼかし状態の表示
  return (
    <div className={`relative ${className}`}>
      {/* ぼかし処理された画像 */}
      <div className="filter blur-xl brightness-50 pointer-events-none">
        {children}
      </div>

      {/* オーバーレイ（警告＋解除ボタン） */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer group hover:bg-black/50 transition-colors"
        onClick={handleReveal}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleReveal();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="非フォロワーの画像を表示"
      >
        {/* 警告アイコン */}
        <div className="mb-3">
          <AlertTriangle className="w-12 h-12 text-yellow-400" />
        </div>

        {/* 警告テキスト */}
        <div className="text-white text-center px-4 mb-4">
          <p className="font-semibold text-sm mb-1">非フォローユーザーの画像</p>
          <p className="text-xs text-gray-300">
            クリックして表示
          </p>
        </div>

        {/* 解除ボタン */}
        <button
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors group-hover:scale-105 transform duration-200"
          onClick={(e) => {
            e.stopPropagation();
            handleReveal();
          }}
        >
          <Eye className="w-4 h-4" />
          <span className="text-sm font-medium">画像を表示</span>
        </button>
      </div>
    </div>
  );
}
