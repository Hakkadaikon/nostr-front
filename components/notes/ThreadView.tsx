"use client";
import { useTimeline } from '../../features/timeline/hooks/useTimeline';
import { toThread } from '../../features/notes/thread';
import NoteCard from './NoteCard';

export default function ThreadView({ id }: { id: string }) {
  const { events } = useTimeline([{ kinds: [1, 6], limit: 200 } as any]);
  const thread = toThread(id, events);
  const byId = new Map(events.map(e => [e.id, e] as const));
  return (
    <div className="space-y-3">
      {thread.parents.map(pid => {
        const e = byId.get(pid);
        return e ? <NoteCard key={e.id} id={e.id} content={e.content} /> : null;
      })}
      {byId.get(id) && <NoteCard id={id} content={byId.get(id)!.content} />}
      {thread.children.map(cid => {
        const e = byId.get(cid);
        return e ? <NoteCard key={e.id} id={e.id} content={e.content} /> : null;
      })}
    </div>
  );
}
