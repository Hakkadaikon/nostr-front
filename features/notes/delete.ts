import { SimplePool } from 'nostr-tools';
import { signEvent } from '../../lib/nostr/signatures';
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
    const state = useAuthStore.getState();

    const secret = state.nsec;

    if (!secret) {
      return '';
    }

    if (secret.startsWith('nsec1')) {
      try {
        const decoded = decode(secret);
        if (decoded.type === 'nsec') {
          return decoded.data as Uint8Array;
        }
        return '';
      } catch (e) {
        return '';
      }
    }

    return secret;
  } catch (e) {
    return '';
  }
}

export async function deleteNote(
  noteId: string,
  reason?: string
): Promise<void> {

  const pool = new SimplePool();

  try {
    // 削除イベント（kind:5）を作成
    const deleteEvent = {
      kind: 5,
      tags: [
        ['e', noteId], // 削除対象のイベントID
      ],
      content: reason || '', // 削除理由（オプション）
      created_at: Math.floor(Date.now() / 1000),
    } as any;

    // 削除理由がある場合はタグに追加
    if (reason) {
      deleteEvent.tags.push(['reason', reason]);
    }

    // 秘密鍵を取得して署名
    const secretKey = getSecretKey();
    if (!secretKey) {
      throw new Error('署名に必要な認証情報がありません');
    }

    const signedEvent = await signEvent(deleteEvent, () => secretKey);

    // 書き込み可能なリレーを取得
    const relayUrls = getWriteRelays();

    if (relayUrls.length === 0) {
      throw new Error('利用可能なリレーがありません');
    }

    // すべてのリレーに送信
    for (const url of relayUrls) {
      await pool.ensureRelay(url);
    }
    const promises = relayUrls.map(url =>
      pool.publish([url], signedEvent)
    );

    await Promise.all(promises);

  } catch (error) {
    throw error;
  } finally {
    const relayUrls = getWriteRelays();
    pool.close(relayUrls);
  }
}