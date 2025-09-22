"use client";

import Link from 'next/link';
import { nip19 } from 'nostr-tools';
import { parseNostrUri } from '../../lib/utils/url';
import EmbeddedNote from '../notes/EmbeddedNote';
import { useMemo, ReactNode } from 'react';
import { LinkPreview } from './LinkPreview';
import { EmbeddedImage } from './EmbeddedMedia';

interface RichContentProps {
  content: string;
  tags?: string[][];
}

const TOKEN_REGEX = /(nostr:[^\s]+|https?:\/\/[^\s]+)/gi;
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|avif|svg)$/i;

function isImageUrl(url: string) {
  try {
    const parsed = new URL(url);
    return IMAGE_EXTENSIONS.test(parsed.pathname);
  } catch {
    return false;
  }
}

function renderText(text: string) {
  if (!text) return null;
  return text;
}

function renderLink(url: string, key: string) {
  if (isImageUrl(url)) {
    return <EmbeddedImage key={key} url={url} />;
  }
  return <LinkPreview key={key} url={url} />;
}

function renderNostr(token: string, key: string, tags?: string[][]) {
  const parsed = parseNostrUri(token);
  if (!parsed) {
    return (
      <span key={key} className="text-purple-600">
        {token}
      </span>
    );
  }

  switch (parsed.type) {
    case 'note': {
      return (
        <EmbeddedNote
          key={key}
          reference={{ id: parsed.data as string }}
          className="mt-3"
        />
      );
    }
    case 'nevent': {
      const data = parsed.data as { id: string; relays?: string[] };
      return (
        <EmbeddedNote
          key={key}
          reference={{ id: data.id, relays: data.relays }}
          className="mt-3"
        />
      );
    }
    case 'npub': {
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
    case 'nprofile': {
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
    default:
      return (
        <span key={key} className="text-purple-600">
          {token}
        </span>
      );
  }
}

export function RichContent({ content, tags }: RichContentProps) {
  const nodes = useMemo(() => {
    const elements: ReactNode[] = [];
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
        elements.push(renderNostr(token, `${match.index}-${token}`, tags));
      } else if (token.startsWith('http')) {
        elements.push(renderLink(token, `${match.index}-${token}`));
      }

      lastIndex = match.index + token.length;
    }

    if (lastIndex < content.length) {
      elements.push(renderText(content.slice(lastIndex)));
    }

    return elements;
  }, [content, tags]);

  return (
    <div className="text-gray-900 dark:text-white whitespace-pre-wrap break-words">
      {nodes}
    </div>
  );
}
