"use client";
import ComposeBox from '../components/compose/ComposeBox';
import { useTimeline } from '../features/timeline/hooks/useTimeline';
import NoteCard from '../components/notes/NoteCard';

export default function HomePage() {
  const { events } = useTimeline();
  return (
    <section className="space-y-4">
      <ComposeBox />
      <div className="space-y-3">
        {events.map(e => (
          <NoteCard key={e.id} id={e.id} content={e.content} />
        ))}
      </div>
    </section>
  );
}
