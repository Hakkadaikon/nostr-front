import type { Event as NostrEvent } from 'nostr-tools';
import { KINDS } from '../../lib/utils/constants';
import { buildReplyTags } from '../../lib/nostr/nip10';
import { buildRepostTags, buildQuote } from '../../lib/nostr/nip18';
import { signEvent, verify } from '../../lib/nostr/signatures';
import { publish as publishClient } from '../../lib/nostr/client';
import { decode } from '../../lib/nostr/nip19';
import { secureLog, performanceLog } from '../../lib/utils/secureLogger';

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
    const state = useAuthStore.getState();

    // セキュリティ配慮: 機密情報を含まないログ出力
    secureLog.debug('[getSecretKey] Auth state check', {
      hasNsec: !!state.nsec,
      hasPublicKey: !!state.publicKey,
      locked: state.locked
    });

    // nsecから秘密鍵を取得（secretKeyプロパティは存在しない）
    const secret = state.nsec;

    if (!secret) {
      secureLog.info('[getSecretKey] No secret key found in auth store');
      secureLog.debug('[getSecretKey] Note: nsec is not persisted on page reload for security');
      return '';
    }

    if (secret.startsWith('nsec1')) {
      try {
        const decoded = decode(secret);
        if (decoded.type === 'nsec') {
          secureLog.debug('[getSecretKey] Successfully decoded nsec');
          return decoded.data as Uint8Array;
        }
        secureLog.error('[getSecretKey] Decoded data is not nsec type:', decoded.type);
        return '';
      } catch (e) {
        secureLog.error('[getSecretKey] Failed to decode nsec:', e);
        return '';
      }
    }

    // hex形式の秘密鍵の場合（通常はnsec形式のはず）
    console.log('[getSecretKey] Using hex secret key (unusual case)');
    return secret;
  } catch (e) {
    console.error('[getSecretKey] Error:', e);
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
  console.log('[publishNote] Starting note publication');
  const relays = getWriteRelays();
  console.log('[publishNote] Write relays:', relays);

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

  console.log('[publishNote] Unsigned event created:', { kind: unsigned.kind, contentLength: content.length });

  let signed: NostrEvent;
  try {
    // 秘密鍵を取得して関数として渡す
    const secretKey = getSecretKey();
    console.log('[publishNote] Authentication method available:', !!secretKey);

    // 秘密鍵がない場合はNIP-07を試す（signEvent内で自動的に処理される）
    signed = await signEvent(unsigned, secretKey ? () => secretKey : undefined);
    console.log('[publishNote] Event signed successfully');
  } catch (e) {
    console.error('[publishNote] Failed to sign event:', e);
    try { require('../../lib/utils/logger').recordSignError(e); } catch {}
    throw e;
  }

  if (!verify(signed)) {
    console.error('[publishNote] Invalid signature');
    throw new Error('Invalid signature');
  }

  console.log('[publishNote] Signature verified, publishing to relays...');
  const results = await publishClient(relays, signed);

  const successCount = results.filter(r => r.ok).length;
  console.log(`[publishNote] Published to ${successCount}/${results.length} relays`);

  await record(results);
  return { ok: results.some(r => r.ok), results, event: signed };
}

export async function publishRepost(targetId: string, targetAuthor?: string) {
  console.log('[publishRepost] Starting repost publication');
  const relays = getWriteRelays();
  const tags = buildRepostTags(targetId, targetAuthor, relays);
  const unsigned: Omit<NostrEvent, 'id' | 'sig'> = {
    kind: KINDS.REPOST,
    content: '',
    created_at: Math.floor(Date.now() / 1000),
    tags,
  } as any;
  // 秘密鍵を取得して関数として渡す
  const secretKey = getSecretKey();
  console.log('[publishRepost] Authentication method available:', !!secretKey);
  // 秘密鍵がない場合はNIP-07を試す（signEvent内で自動的に処理される）
  const signed = await signEvent(unsigned, secretKey ? () => secretKey : undefined);
  if (!verify(signed)) throw new Error('Invalid signature');
  const results = await publishClient(relays, signed);
  await record(results);
  return { ok: results.some(r => r.ok), results, event: signed };
}

export async function publishQuote(targetId: string) {
  console.log('[publishQuote] Starting quote publication');
  const relays = getWriteRelays();
  const { content, tags } = buildQuote(targetId, relays);
  const unsigned: Omit<NostrEvent, 'id' | 'sig'> = {
    kind: KINDS.NOTE,
    content,
    created_at: Math.floor(Date.now() / 1000),
    tags,
  } as any;
  // 秘密鍵を取得して関数として渡す
  const secretKey = getSecretKey();
  console.log('[publishQuote] Authentication method available:', !!secretKey);
  // 秘密鍵がない場合はNIP-07を試す（signEvent内で自動的に処理される）
  const signed = await signEvent(unsigned, secretKey ? () => secretKey : undefined);
  if (!verify(signed)) throw new Error('Invalid signature');
  const results = await publishClient(relays, signed);
  await record(results);
  return { ok: results.some(r => r.ok), results, event: signed };
}
