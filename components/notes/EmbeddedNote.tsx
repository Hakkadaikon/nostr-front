"use client";

import { useEffect, useMemo, useState } from 'react';
import type { Event as NostrEvent } from 'nostr-tools';
import NoteCard from './NoteCard';
import { fetchNote } from '../../features/notes/fetchNote';
import { Spinner } from '../ui/Spinner';

export type NoteReference = {
  id: string;
  relays?: string[];
};

interface EmbeddedNoteProps {
  reference: NoteReference;
  className?: string;
}

export default function EmbeddedNote({ reference, className }: EmbeddedNoteProps) {
  const [note, setNote] = useState<NostrEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { relayKey, relays } = useMemo(() => {
    const list = reference.relays ? [...reference.relays] : [];
    const key = list.length > 0 ? [...list].sort().join(',') : '';
    return { relays: list, relayKey: key };
  }, [reference.relays]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setNote(null);

    fetchNote(reference.id, relays).then(event => {
      if (!active) return;
      setNote(event);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [reference.id, relayKey, relays]);

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white/60 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
          <Spinner size="small" />
          <span>ノートを読み込んでいます...</span>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className={className}>
        <div className="rounded-xl border border-gray-200 bg-white/60 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
          このノートを取得できませんでした。
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <NoteCard id={note.id} content={note.content} />
    </div>
  );
}
