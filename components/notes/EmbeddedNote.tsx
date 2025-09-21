"use client";
import { useTimeline } from '../../features/timeline/hooks/useTimeline';
import NoteCard from './NoteCard';

export default function EmbeddedNote({ id }: { id: string }) {
  const { tweets } = useTimeline({ type: 'home', limit: 1 });
  const e = tweets[0];
  if (!e) return <div className="rounded border p-2 text-xs text-gray-500">Embedded note: {id}</div>;
  return <NoteCard id={e.id} content={e.content} />;
}
