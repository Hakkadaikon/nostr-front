"use client";

import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { SafeImage } from '../ui/SafeImage';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Spinner } from '../ui/Spinner';
import { fetchNote } from '../../features/notes/fetchNote';
import { subscribeTo, getReadRelays } from '../../features/relays/services/relayPool';
import { useRelaysStore } from '../../stores/relays.store';
import { type Event as NostrEvent, nip19 } from 'nostr-tools';
import { KIND_METADATA } from '../../lib/nostr/constants';

interface QuotedTweetProps {
  quoteId: string;
  relays?: string[];
}

export function QuotedTweet({ quoteId, relays = [] }: QuotedTweetProps) {
  const [note, setNote] = useState<NostrEvent | null>(null);
  const [author, setAuthor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setNote(null);
    setAuthor(null);

    // リレー設定を取得
    const relaysStore = useRelaysStore.getState();
    const configuredRelays = getReadRelays(relaysStore.relays);
    const allRelays = Array.from(new Set([...relays, ...(configuredRelays || [])]));

    // ノートを取得
    fetchNote(quoteId, allRelays).then(async (event) => {
      if (!active) return;
      setNote(event);

      if (event) {
        // 作者情報を取得
        const authorSub = subscribeTo(
          allRelays,
          [{ kinds: [KIND_METADATA], authors: [event.pubkey], limit: 1 }],
          (authorEvent: NostrEvent) => {
            try {
              const content = JSON.parse(authorEvent.content);
              const profile = {
                id: event.pubkey,
                username: content.username || content.name || nip19.npubEncode(event.pubkey).slice(0, 12),
                name: content.display_name || content.name || '',
                avatar: content.picture || `https://robohash.org/${event.pubkey}`,
              };
              setAuthor(profile);
              setIsLoading(false);
              authorSub.close();
            } catch (error) {
              console.error('Failed to parse author profile:', error);
              setIsLoading(false);
            }
          }
        );

        // タイムアウト設定
        setTimeout(() => {
          authorSub.close();
          if (!author) {
            // デフォルトプロフィール
            setAuthor({
              id: event.pubkey,
              username: nip19.npubEncode(event.pubkey).slice(0, 12),
              name: 'Nostr User',
              avatar: `https://robohash.org/${event.pubkey}`,
            });
          }
          setIsLoading(false);
        }, 2000);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [quoteId, relays]);

  if (isLoading) {
    return (
      <div className="mt-3 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
        <div className="flex items-center gap-2">
          <Spinner size="small" />
          <span className="text-sm text-gray-500 dark:text-gray-400">ノートを読み込んでいます...</span>
        </div>
      </div>
    );
  }

  if (!note || !author) {
    return (
      <div className="mt-3 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">このノートを取得できませんでした。</p>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(note.created_at * 1000), {
    addSuffix: true,
    locale: ja,
  });

  return (
    <Link 
      href={`/note/${note.id}`} 
      className="block mt-3 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-all duration-200 cursor-pointer"
    >
      <div className="flex gap-3">
        {/* アバター */}
        <div className="flex-shrink-0">
          {author.avatar ? (
            <SafeImage
              src={author.avatar}
              alt={author.name}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* ヘッダー */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-bold text-gray-900 dark:text-white text-sm">
              {author.name}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              @{author.username}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">·</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {timeAgo}
            </span>
          </div>

          {/* コンテンツ */}
          <div className="mt-1">
            <p className="text-gray-900 dark:text-white text-sm line-clamp-3">
              {note.content}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}