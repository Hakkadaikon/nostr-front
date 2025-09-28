"use client";

import { nip19 } from 'nostr-tools';
import EmbeddedNote from './EmbeddedNote';

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

export default function NoteCard({ content, id }: { id: string; content: string }) {
  return (
    <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80 backdrop-blur-sm p-4 shadow-sm hover:shadow-md transition-shadow">
      <p className="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">{renderContent(content)}</p>
    </article>
  );
}
