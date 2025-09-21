"use client";
import { useTimeline } from '../../features/timeline/hooks/useTimeline';
import NoteCard from './NoteCard';

export default function EmbeddedNote({ id }: { id: string }) {
  const { events } = useTimeline([{ ids: [id], kinds: [1, 6], limit: 1 } as any]);
  const e = events[0];
  if (!e) return <div className="rounded border p-2 text-xs text-gray-500">Embedded note: {id}</div>;
  const { verify } = require('../../lib/nostr/signatures');
  if (!verify(e)) return <div className="rounded border p-2 text-xs text-red-500">Invalid event</div>;
  return <NoteCard id={e.id} content={e.content} />;
}
