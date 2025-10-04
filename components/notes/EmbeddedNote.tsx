"use client";

import { useEffect, useMemo, useState } from 'react';
import type { Event as NostrEvent } from 'nostr-tools';
import { nip19 } from 'nostr-tools';
import NoteCard from './NoteCard';
import { fetchNote } from '../../features/notes/fetchNote';
import { fetchProfileForNotification } from '../../features/profile/services/profile-cache';
import { Spinner } from '../ui/Spinner';
import type { NotificationUser } from '../../types/notification';
import { useNoteCacheStore } from '../../stores/note-cache.store';

export type NoteReference = {
  id: string;
  relays?: string[];
};

interface EmbeddedNoteProps {
  reference: NoteReference;
  className?: string;
}

export default function EmbeddedNote({ reference, className }: EmbeddedNoteProps) {
  const { getNote, setNote: setCachedNote } = useNoteCacheStore();

  const [note, setNote] = useState<NostrEvent | null>(null);
  const [author, setAuthor] = useState<NotificationUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { relayKey, relays } = useMemo(() => {
    const list = reference.relays ? [...reference.relays] : [];
    const key = list.length > 0 ? [...list].sort().join(',') : '';
    return { relays: list, relayKey: key };
  }, [reference.relays]);

  useEffect(() => {
    let active = true;

    // キャッシュチェック：既にキャッシュがあれば何もしない
    const cached = getNote(reference.id);
    if (cached) {
      // キャッシュヒット時は状態を更新して終了（ちらつき防止）
      if (active) {
        setNote(cached.note);
        setAuthor(cached.author || null);
        setIsLoading(false);
      }
      return;
    }

    // キャッシュミス：ローディング状態にしてフェッチ開始
    if (active) {
      setIsLoading(true);
      setNote(null);
      setAuthor(null);
    }

    // Safety timeout: in rare cases fetchNote may hang (relay never sends EOSE)
    const safetyTimeout = setTimeout(() => {
      if (active) {
        console.warn('EmbeddedNote: Safety timeout reached, showing error fallback');
        setIsLoading(false);
      }
    }, 8000); // Extended safety window for slower relays

    // Use longer timeout for fetchNote to accommodate slower relays
    fetchNote(reference.id, relays.length > 0 ? relays : undefined, 6000)
      .then(async event => {
        if (!active || !event) return;
        setNote(event);

        // Fetch author profile
        let authorProfile: NotificationUser | undefined;
        if (event.pubkey) {
          try {
            const profile = await fetchProfileForNotification(event.pubkey);
            if (active) {
              setAuthor(profile);
              authorProfile = profile;
            }
          } catch (error) {
            console.error('EmbeddedNote: Error fetching author profile', error);
            // プロフィール取得失敗でもノートは表示する
          }
        }

        // キャッシュに保存
        setCachedNote(reference.id, event, authorProfile);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('EmbeddedNote: Error fetching note', error);
        if (!active) return;
        setNote(null);
        setIsLoading(false);
      })
      .finally(() => {
        clearTimeout(safetyTimeout);
      });

    return () => {
      active = false;
      clearTimeout(safetyTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference.id, relayKey]); // relayKeyでrelay変更を検知、relays配列自体は含めない（不要な再レンダリングを防ぐ）

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

  if (!note && !isLoading) {
    return (
      <div className={className}>
        <div className="rounded-xl border border-gray-200 bg-white/60 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
          このノートを取得できませんでした。
        </div>
      </div>
    );
  }

  if (!note) {
    return null;
  }

  return (
    <div className={className}>
      <NoteCard
        id={note.id}
        content={note.content}
        author={author ? {
          pubkey: author.pubkey,
          npub: author.npub,
          name: author.name,
          username: author.username,
          avatar: author.avatar,
        } : undefined}
      />
    </div>
  );
}
