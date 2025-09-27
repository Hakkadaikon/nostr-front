"use client";

import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { SafeImage } from '../ui/SafeImage';
import EmbeddedNote from '../notes/EmbeddedNote';
import { RichContent } from './RichContent';
import Link from 'next/link';
import { Tweet } from '../../features/timeline/types';
import { Heart, MessageCircle, Repeat2, Share, Zap, MoreHorizontal, Trash2, Smile } from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import { QuotedTweet } from './QuotedTweet';
import { ActivityPubBadge } from '../ui/ActivityPubBadge';
import { isActivityPubUser } from '../../lib/utils/activitypub';
import { useState } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { deleteNote } from '../../features/notes/delete';
import { createReaction } from '../../features/reactions/services/reaction';

interface TimelineItemProps {
  tweet: Tweet;
  onLike: (tweetId: string) => void;
  onRetweet: (tweetId: string) => void;
  onZap?: (tweetId: string) => void;
  onReply?: (tweet: Tweet) => void;
  onDelete?: (tweetId: string) => void;
}

const QUICK_EMOJIS = ['😀', '😂', '😍', '👍', '🔥', '👏', '😢', '🙏'];

export function TimelineItem({ tweet, onLike, onRetweet, onZap, onReply, onDelete }: TimelineItemProps) {
  const { publicKey } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const activity = tweet.activity;
  const actor = activity?.actor;
  const timelineTimestamp = tweet.activityTimestamp ?? tweet.createdAt;

  const timeAgo = formatDistanceToNow(new Date(timelineTimestamp), {
    addSuffix: true,
    locale: ja,
  });

  // 自分の投稿かどうかを判定
  const isOwnTweet = publicKey && tweet.author.pubkey === publicKey;
  const targetNoteId = activity?.targetNoteId ?? tweet.id;
  const canInteractWithNote = !activity || !!activity.targetNoteId;
  const noteAuthorPubkey = tweet.author.pubkey || tweet.author.id;

  const handleDelete = async () => {
    if (!isOwnTweet) return;

    setIsDeleting(true);
    try {
      await deleteNote(tweet.id);
      onDelete?.(tweet.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete tweet:', error);
      alert('投稿の削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEmojiReaction = async (emoji: string) => {
    if (!canInteractWithNote || !targetNoteId || !noteAuthorPubkey) return;
    try {
      await createReaction(targetNoteId, noteAuthorPubkey, emoji);
    } catch (error) {
      console.error('Failed to send emoji reaction:', error);
      alert('リアクションの送信に失敗しました');
    } finally {
      setShowEmojiPicker(false);
    }
  };

  const renderActivityLabel = () => {
    if (!activity || !actor) return null;
    const actorName = actor.name || actor.username || actor.npub?.slice(0, 12) || actor.id.slice(0, 12);
    switch (activity.type) {
      case 'repost':
        return (
          <span>
            <Link
              href={`/profile/${actor.npub || actor.id}` as any}
              className="font-semibold text-gray-900 dark:text-white hover:underline"
            >
              {actorName}
            </Link>
            <span className="ml-2">がリポストしました</span>
          </span>
        );
      case 'like':
        return (
          <span>
            <Link
              href={`/profile/${actor.npub || actor.id}` as any}
              className="font-semibold text-gray-900 dark:text-white hover:underline"
            >
              {actorName}
            </Link>
            <span className="ml-2">がこの投稿にいいねしました</span>
          </span>
        );
      case 'emoji':
        return (
          <span className="flex items-center gap-2">
            <Link
              href={`/profile/${actor.npub || actor.id}` as any}
              className="font-semibold text-gray-900 dark:text-white hover:underline"
            >
              {actorName}
            </Link>
            <span>が</span>
            <span className="text-lg">{activity.emoji}</span>
            <span>リアクションを送りました</span>
          </span>
        );
      case 'zap':
        return (
          <span>
            <Link
              href={`/profile/${actor.npub || actor.id}` as any}
              className="font-semibold text-gray-900 dark:text-white hover:underline"
            >
              {actorName}
            </Link>
            <span className="ml-2">が {activity.amountSats?.toLocaleString() ?? 0} sats Zap を送りました</span>
          </span>
        );
      case 'reply':
        return (
          <span>
            <Link
              href={`/profile/${actor.npub || actor.id}` as any}
              className="font-semibold text-gray-900 dark:text-white hover:underline"
            >
              {actorName}
            </Link>
            <span className="ml-2">が返信しました</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <article className="overflow-hidden border-b border-gray-200 dark:border-gray-800 p-4 sm:p-6 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-all duration-200 group">
      <div className="flex gap-3 sm:gap-4 w-full">
        {/* アバター */}
        <Link href={`/profile/${tweet.author.npub || tweet.author.id}` as any} className="flex-shrink-0">
          {tweet.author.avatar ? (
            <SafeImage
              src={tweet.author.avatar}
              alt={tweet.author.name}
              width={48}
              height={48}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full hover:opacity-90 transition-opacity"
            />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
          )}
        </Link>

        <div className="flex-1 min-w-0">
          {activity && actor && (
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <Link
                href={`/profile/${actor.npub || actor.id}` as any}
                className="flex-shrink-0"
              >
                {actor.avatar ? (
                  <SafeImage
                    src={actor.avatar}
                    alt={actor.name}
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                )}
              </Link>
              <div className="flex-1 min-w-0 text-sm sm:text-base">
                {renderActivityLabel()}
                {activity.type === 'zap' && activity.message && (
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {activity.message}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ヘッダー */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1 flex-wrap">
              <Link
                href={`/profile/${tweet.author.npub || tweet.author.id}` as any}
                className="font-bold text-gray-900 dark:text-white hover:underline"
              >
                {tweet.author.name}
              </Link>
              <Link
                href={`/profile/${tweet.author.npub || tweet.author.id}` as any}
                className="text-gray-500 dark:text-gray-400"
              >
                @{tweet.author.username}
              </Link>
              {isActivityPubUser(tweet.author) && (
                <ActivityPubBadge size="small" className="ml-1" />
              )}
              <span className="text-gray-500 dark:text-gray-400">·</span>
              <Link
                href={`/status/${tweet.id}` as any}
                className="text-gray-500 dark:text-gray-400 hover:underline"
              >
                {timeAgo}
              </Link>
            </div>

            {/* メニューボタン（自分の投稿のみ表示） */}
            {isOwnTweet && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                >
                  <MoreHorizontal size={18} className="text-gray-500 dark:text-gray-400" />
                </button>

                {/* ドロップダウンメニュー */}
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowDeleteConfirm(true);
                        }}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        投稿を削除
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 返信元 */}
          {tweet.parentId && (
            <div className="mb-2">
              <EmbeddedNote reference={{ id: tweet.parentId }} />
            </div>
          )}
          {/* コンテンツ */}
          {tweet.content && tweet.content.trim().length > 0 && (
            <div className="mt-2">
              <RichContent content={tweet.content} tags={tweet.tags} suppressNoteIds={tweet.quote ? [tweet.quote.id] : undefined} />
            </div>
          )}

          {/* 引用ツイート */}
          {tweet.quote && (
            <QuotedTweet quoteId={tweet.quote.id} relays={tweet.quote.relays} />
          )}

          {/* メディア */}
          {tweet.media && tweet.media.length > 0 && (
            <div className={`mt-3 grid gap-2 ${
              tweet.media.length === 1 ? 'grid-cols-1' : 
              tweet.media.length === 2 ? 'grid-cols-2' : 
              tweet.media.length === 3 ? 'grid-cols-2 sm:grid-cols-3' : 
              'grid-cols-2'
            }`}>
              {tweet.media.map((media, index) => (
                <div key={media.id} className={`relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 ${
                  tweet.media && tweet.media.length === 3 && index === 2 ? 'col-span-2 sm:col-span-1' : ''
                }`}>
                  {media.type === 'image' && (
                    <SafeImage
                      src={media.url}
                      alt={media.altText || ''}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* アクションバー */}
          <div className="mt-3 flex items-center justify-between sm:max-w-lg lg:max-w-xl">
            {/* 返信 */}
            <IconButton
              onClick={() => canInteractWithNote && onReply?.(tweet)}
              variant="share"
              size="small"
              disabled={!canInteractWithNote}
              count={tweet.repliesCount}
              aria-label="返信"
            >
              <MessageCircle size={18} />
            </IconButton>

            {/* リツイート */}
            <IconButton
              onClick={() => canInteractWithNote && onRetweet(targetNoteId)}
              variant="retweet"
              size="small"
              active={tweet.isRetweeted}
              count={tweet.retweetsCount}
              disabled={!canInteractWithNote}
              aria-label="リツイート"
            >
              <Repeat2 size={18} />
            </IconButton>

            {/* いいね */}
            <IconButton
              onClick={() => canInteractWithNote && onLike(targetNoteId)}
              variant="like"
              size="small"
              active={tweet.isLiked}
              count={tweet.likesCount}
              disabled={!canInteractWithNote}
              aria-label="いいね"
            >
              <Heart
                size={18}
                fill={tweet.isLiked ? 'currentColor' : 'none'}
              />
            </IconButton>

            {/* 絵文字リアクション */}
            <IconButton
              onClick={() => {
                if (!canInteractWithNote) return;
                setShowEmojiPicker(prev => !prev);
              }}
              variant="share"
              size="small"
              aria-label="リアクション"
              disabled={!canInteractWithNote}
            >
              <Smile size={18} />
            </IconButton>

            {/* Zap */}
            <IconButton
              onClick={() => {
                if (!canInteractWithNote) return;
                onZap?.(targetNoteId);
              }}
              variant="zap"
              size="small"
              count={tweet.zapsCount}
              disabled={!canInteractWithNote}
              aria-label="Zap"
            >
              <Zap size={18} />
            </IconButton>

            {/* 共有 */}
            <IconButton
              variant="share"
              size="small"
              aria-label="共有"
            >
              <Share size={18} />
            </IconButton>
          </div>

          {showEmojiPicker && canInteractWithNote && (
            <div className="mt-2 flex flex-wrap gap-2 sm:gap-3">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiReaction(emoji)}
                  className="px-3 py-2 text-lg rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">投稿を削除しますか？</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              この操作は取り消せません。投稿は完全に削除されます。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? '削除中...' : '削除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
