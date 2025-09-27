"use client";

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
    <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80 backdrop-blur-sm p-4 shadow-sm hover:shadow-md transition-shadow">
      <p className="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">{renderContent(content)}</p>
    </article>
  );
}
