"use client";
import { useTimeline } from '../../features/timeline/hooks/useTimeline';
import NoteCard from './NoteCard';

export default function ThreadView({ id }: { id: string }) {
  const { tweets } = useTimeline({ type: 'home', limit: 200 });
  
  // Find the target tweet
  const targetTweet = tweets.find(t => t.id === id);
  if (!targetTweet) {
    return <div className="text-gray-500">Tweet not found</div>;
  }
  
  // Simple thread view - just show the target tweet
  return (
    <div className="space-y-3">
      <NoteCard id={targetTweet.id} content={targetTweet.content} />
    </div>
  );
}
