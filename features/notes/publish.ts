import type { Event as NostrEvent } from 'nostr-tools';
import { KINDS } from '../../lib/utils/constants';
import { buildReplyTags } from '../../lib/nostr/nip10';
import { buildRepostTags, buildQuote } from '../../lib/nostr/nip18';
import { signEvent, verify } from '../../lib/nostr/signatures';
import { publish as publishClient } from '../../lib/nostr/client';
import { decode } from '../../lib/nostr/nip19';

function getWriteRelays(): string[] {
  try {
    const { useRelaysStore } = require('../../stores/relays.store');
    return useRelaysStore.getState().relays.filter((r: any) => r.write).map((r: any) => r.url);
  } catch {
    return [];
  }
}

function getSecretKey(): string | Uint8Array {
  try {
    const { useAuthStore } = require('../../stores/auth.store');
    const secret = useAuthStore.getState().nsec as string | null;
    if (!secret) return '';
    if (secret.startsWith('nsec1')) {
      try {
        const decoded = decode(secret);
        if (decoded.type === 'nsec') {
          return decoded.data as Uint8Array;
        }
        return '';
      } catch {
        return '';
      }
    }
    return secret; // hex形式の場合は文字列のまま
  } catch {
    return '';
  }
}

async function record(results: { relay: string; ok: boolean; error?: unknown }[]) {
  try {
    const { recordPublishResult } = require('../../lib/utils/logger');
    for (const r of results) await recordPublishResult(r);
  } catch {}
}

export async function publishNote(content: string, extra?: { 
  rootId?: string; 
  replyToId?: string;
  rootAuthor?: string;
  replyAuthor?: string;
  rootRelay?: string;
  replyRelay?: string;
}) {
  const relays = getWriteRelays();
  const tags = buildReplyTags({ 
    rootId: extra?.rootId, 
    replyToId: extra?.replyToId,
    rootAuthor: extra?.rootAuthor,
    replyAuthor: extra?.replyAuthor,
    rootRelay: extra?.rootRelay,
    replyRelay: extra?.replyRelay,
  });
  const unsigned: Omit<NostrEvent, 'id' | 'sig'> = {
    kind: KINDS.NOTE,
    content,
    created_at: Math.floor(Date.now() / 1000),
    tags,
  } as any;
  let signed: NostrEvent;
  try {
    signed = await signEvent(unsigned, getSecretKey);
  } catch (e) {
    try { require('../../lib/utils/logger').recordSignError(e); } catch {}
    throw e;
  }
  if (!verify(signed)) throw new Error('Invalid signature');
  const results = await publishClient(relays, signed);
  await record(results);
  return { ok: results.some(r => r.ok), results, event: signed };
}

export async function publishRepost(targetId: string, targetAuthor?: string) {
  const relays = getWriteRelays();
  const tags = buildRepostTags(targetId, targetAuthor, relays);
  const unsigned: Omit<NostrEvent, 'id' | 'sig'> = {
    kind: KINDS.REPOST,
    content: '',
    created_at: Math.floor(Date.now() / 1000),
    tags,
  } as any;
  const signed = await signEvent(unsigned, getSecretKey);
  if (!verify(signed)) throw new Error('Invalid signature');
  const results = await publishClient(relays, signed);
  await record(results);
  return { ok: results.some(r => r.ok), results, event: signed };
}

export async function publishQuote(targetId: string) {
  const relays = getWriteRelays();
  const { content, tags } = buildQuote(targetId, relays);
  const unsigned: Omit<NostrEvent, 'id' | 'sig'> = {
    kind: KINDS.NOTE,
    content,
    created_at: Math.floor(Date.now() / 1000),
    tags,
  } as any;
  const signed = await signEvent(unsigned, getSecretKey);
  if (!verify(signed)) throw new Error('Invalid signature');
  const results = await publishClient(relays, signed);
  await record(results);
  return { ok: results.some(r => r.ok), results, event: signed };
}
