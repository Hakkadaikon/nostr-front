"use client";
import { publishRepost } from '../../features/notes/publish';

function renderContent(text: string) {
  const parts = text.split(/(nostr:[a-z0-9]+)/i);
  return parts.map((p, i) => {
    if (/^nostr:/i.test(p)) {
      return <a key={i} href={p} className="underline" rel="noopener noreferrer">{p}</a>;
    }
    return <span key={i}>{p}</span>;
  });
}

export default function NoteCard({ content, id }: { id: string; content: string }) {
  return (
    <article className="rounded border p-3">
      <p className="whitespace-pre-wrap break-words">{renderContent(content)}</p>
      <div className="mt-2 text-xs text-gray-500 flex gap-3">
        <button className="underline" onClick={() => publishRepost(id)}>Repost</button>
        {/* Reply / Quote could open composer; omitted here for brevity */}
      </div>
    </article>
  );
}
