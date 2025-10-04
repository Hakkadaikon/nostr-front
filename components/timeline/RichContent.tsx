"use client";

import Link from 'next/link';
import { nip19 } from 'nostr-tools';
import { parseNostrUri } from '../../lib/utils/url';
import EmbeddedNote from '../notes/EmbeddedNote';
import { useMemo, ReactNode } from 'react';
import { MediaEmbed } from './MediaEmbed';
import { isImageUrl, isVideoUrl, isAudioUrl } from '../../lib/utils/media-urls';
import { SensitiveImage } from '../ui/SensitiveImage';

interface RichContentProps {
  content: string;
  tags?: string[][];
  suppressNoteIds?: string[];
  suppressUrls?: string[];
  authorPubkey?: string; // 投稿者の公開鍵（フォロー判定に使用）
  actorPubkey?: string; // アクター（リアクション・リポスト等をした人）の公開鍵
}

const TOKEN_REGEX = /(nostr:[^\s]+|https?:\/\/[^\s]+)/gi;

function renderText(text: string) {
  if (!text) return null;
  return text;
}

function renderLink(url: string, key: string, seenUrls: Set<string>, suppressUrls?: string[], authorPubkey?: string, actorPubkey?: string) {
  // 末尾に付与されがちな括弧や句読点を除去（Markdown の ![]() や文章中の括弧閉じ対策）
  const cleaned = url.replace(/[)\]\}>,.;]+$/g, '');
  if (seenUrls.has(cleaned)) {
    return null;
  }
  seenUrls.add(cleaned);

  // suppressUrlsに含まれる場合は表示しない
  if (suppressUrls?.some(suppressUrl => cleaned === suppressUrl || cleaned.startsWith(suppressUrl))) {
    return null;
  }

  // 画像URLの場合はインライン表示（SensitiveImageでラップ）
  if (isImageUrl(cleaned)) {
    return (
      <span key={key} className="inline-block my-2">
        <SensitiveImage
          src={cleaned}
          alt="Embedded image"
          authorPubkey={authorPubkey}
          actorPubkey={actorPubkey}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cleaned}
            alt="Embedded image"
            loading="lazy"
            className="max-w-full h-auto max-h-96 rounded-lg border border-gray-200 dark:border-gray-700"
            referrerPolicy="no-referrer"
          />
        </SensitiveImage>
      </span>
    );
  }

  // その他のURL（動画・音声・OGP等）はMediaEmbedで表示
  return (
    <span key={key} className="block">
      <MediaEmbed url={cleaned} authorPubkey={authorPubkey} />
    </span>
  );
}


function renderNostr(
  token: string,
  key: string,
  tags: string[][] | undefined,
  suppressNoteIds: string[] | undefined,
  seenNoteIds: Set<string>
) {
  const parsed = parseNostrUri(token);
  if (!parsed) {
    return (
      <span key={key} className="text-purple-600">
        {token}
      </span>
    );
  }

  if (parsed.type === 'note') {
    const noteId = parsed.data as string;
    if (seenNoteIds.has(noteId)) {
      return null;
    }
    seenNoteIds.add(noteId);
    if (suppressNoteIds?.includes(noteId)) {
      return null;
    }
    return (
      <EmbeddedNote
        key={key}
        reference={{ id: noteId }}
        className="mt-3"
      />
    );
  }

  if (parsed.type === 'nevent') {
    const data = parsed.data as { id: string; relays?: string[] };
    if (seenNoteIds.has(data.id)) {
      return null;
    }
    seenNoteIds.add(data.id);
    if (suppressNoteIds?.includes(data.id)) {
      return null;
    }
    return (
      <EmbeddedNote
        key={key}
        reference={{ id: data.id, relays: data.relays }}
        className="mt-3"
      />
    );
  }

  if (parsed.type === 'npub') {
    const hex = parsed.data as string;
    const npub = nip19.npubEncode(hex);
    return (
      <Link
        key={key}
        href={`/profile/${npub}`}
        className="text-purple-600 underline hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-200"
      >
        @{npub.slice(0, 12)}…
      </Link>
    );
  }

  if (parsed.type === 'nprofile') {
    const data = parsed.data as { pubkey: string };
    const npub = nip19.npubEncode(data.pubkey);
    return (
      <Link
        key={key}
        href={`/profile/${npub}`}
        className="text-purple-600 underline hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-200"
      >
        @{npub.slice(0, 12)}…
      </Link>
    );
  }

  return (
    <span key={key} className="text-purple-600">
      {token}
    </span>
  );
}

export function RichContent({ content, tags, suppressNoteIds, suppressUrls, authorPubkey, actorPubkey }: RichContentProps) {
  const nodes = useMemo(() => {
    const elements: ReactNode[] = [];
    const seenNoteIds = new Set<string>();
    const seenUrls = new Set<string>();
    let lastIndex = 0;
    const matches = content.matchAll(TOKEN_REGEX);

    for (const match of matches) {
      if (!match.index && match.index !== 0) continue;
      const token = match[0];
      if (match.index > lastIndex) {
        const text = content.slice(lastIndex, match.index);
        elements.push(renderText(text));
      }

      if (token.startsWith('nostr:')) {
        const node = renderNostr(
          token,
          `${match.index}-${token}`,
          tags,
          suppressNoteIds,
          seenNoteIds
        );
        if (node) {
          elements.push(node);
        }
      } else if (token.startsWith('http')) {
        const node = renderLink(token, `${match.index}-${token}`, seenUrls, suppressUrls, authorPubkey, actorPubkey);
        if (node) {
          elements.push(node);
        }
      }

      lastIndex = match.index + token.length;
    }

    if (lastIndex < content.length) {
      elements.push(renderText(content.slice(lastIndex)));
    }

    return elements;
  }, [content, tags, suppressNoteIds, suppressUrls, authorPubkey, actorPubkey]);

  return (
    <div className="text-gray-900 dark:text-white whitespace-pre-wrap break-all overflow-hidden">
      {nodes}
    </div>
  );
}
