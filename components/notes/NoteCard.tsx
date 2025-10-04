"use client";

import { nip19 } from 'nostr-tools';
import EmbeddedNote from './EmbeddedNote';
import { SafeImage } from '../ui/SafeImage';
import Link from 'next/link';

function renderContent(text: string) {
  const parts = text.split(/(nostr:[a-z0-9]+)/i);
  return parts.map((p, i) => {
    if (/^nostr:/i.test(p)) {
      const bech = p.slice(6); // remove 'nostr:'
      try {
        const decoded = nip19.decode(bech);
        if (decoded.type === 'note') {
          return <EmbeddedNote key={i} reference={{ id: decoded.data as string }} className="mt-2" />;
        }
        if (decoded.type === 'nevent') {
          const d = decoded.data as { id: string; relays?: string[] };
            return <EmbeddedNote key={i} reference={{ id: d.id, relays: d.relays }} className="mt-2" />;
        }
        if (decoded.type === 'npub' || decoded.type === 'nprofile') {
          return <a key={i} href={`/profile/${bech}`} className="underline" rel="noopener noreferrer">{p}</a>;
        }
      } catch {
        /* fall through to default link */
      }
      return <a key={i} href={p} className="underline" rel="noopener noreferrer">{p}</a>;
    }
    return <span key={i}>{p}</span>;
  });
}

interface NoteCardProps {
  id: string;
  content: string;
  author?: {
    pubkey: string;
    npub?: string;
    name?: string;
    username?: string;
    avatar?: string;
  };
}

export default function NoteCard({ content, id, author }: NoteCardProps) {
  return (
    <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80 backdrop-blur-sm p-4 shadow-sm hover:shadow-md transition-shadow">
      {author && (
        <div className="flex items-center gap-2 mb-2">
          <Link href={`/profile/${author.npub || author.pubkey}` as any} className="flex-shrink-0">
            {author.avatar ? (
              <SafeImage
                src={author.avatar}
                alt={author.name || author.username || 'User'}
                width={24}
                height={24}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
            )}
          </Link>
          <Link
            href={`/profile/${author.npub || author.pubkey}` as any}
            className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:underline"
          >
            {author.name || author.username || author.npub?.slice(0, 12) || author.pubkey.slice(0, 12)}
          </Link>
        </div>
      )}
      <p className="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">{renderContent(content)}</p>
    </article>
  );
}
