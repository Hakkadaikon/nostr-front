import { SimplePool, type Event as NostrEvent, type Filter } from 'nostr-tools';

export type RelayInfo = { url: string; read: boolean; write: boolean; healthy?: boolean };
export type Subscription = { close: () => void };

let pool: SimplePool | null = null;

// SimplePoolを初期化
function getPool() {
  if (!pool) {
    pool = new SimplePool();
  }
  return pool;
}

// ブラウザ環境でのWebSocketエラーを静かに処理（初回のみ実行）
if (typeof window !== 'undefined') {
  let errorHandlerInstalled = false;

  // グローバルエラーハンドラーでWebSocket接続エラーを捕捉
  if (!errorHandlerInstalled) {
    window.addEventListener('error', (event) => {
      // WebSocket関連のエラーを検出
      if (
        event.message &&
        (event.message.includes('WebSocket') || event.message.includes('wss://'))
      ) {
        // エラーの伝播を防止（コンソールにエラーが表示されるのを抑制）
        event.preventDefault();

        // デバッグモードでのみログ出力
        if (process.env.NODE_ENV === 'development') {
          console.debug('[relayPool] WebSocket error suppressed:', event.message);
        }
      }
    }, true); // キャプチャフェーズで処理

    errorHandlerInstalled = true;
  }
}

export function getReadRelays(relays: RelayInfo[]) {
  return relays.filter(r => r.read).map(r => r.url);
}
export function getWriteRelays(relays: RelayInfo[]) {
  return relays.filter(r => r.write).map(r => r.url);
}

export function subscribeTo(
  relays: string[],
  filters: Filter[],
  onEvent: (e: NostrEvent) => void,
  optionsOrOnEose?: { onEose?: () => void; onError?: (url: string, error: any) => void } | (() => void)
): Subscription {
  const p = getPool();

  // 後方互換性: 4番目の引数が関数の場合は従来の () => void として扱う
  const options = typeof optionsOrOnEose === 'function'
    ? { onEose: optionsOrOnEose }
    : optionsOrOnEose;

  try {
    const sub = p.subscribeMany(relays, filters, {
      onevent: (event) => {
        try {
          onEvent(event);
        } catch (error) {
          console.error('[relayPool] Error processing event:', error);
        }
      },
      oneose: () => {
        if (options?.onEose) {
          try {
            options.onEose();
          } catch (error) {
            console.error('[relayPool] Error in onEose callback:', error);
          }
        }
      }
    });

    return { close: () => {
      try {
        sub.close();
      } catch (error) {
        // Silently handle close errors
      }
    }};
  } catch (error) {
    console.warn('[relayPool] Failed to create subscription:', error);
    // Return a dummy subscription that does nothing
    return { close: () => {} };
  }
}

export async function publishTo(relays: string[], event: NostrEvent) {
  const p = getPool();
  const results: { relay: string; ok: boolean; error?: any }[] = [];
  const promises = p.publish(relays, event);
  
  await Promise.all(promises.map(async (promise, index) => {
    try {
      await promise;
      results.push({ relay: relays[index], ok: true });
    } catch (e) {
      results.push({ relay: relays[index], ok: false, error: e });
    }
  }));
  
  return results;
}

export async function checkRelayHealth(url: string, timeoutMs = 1500) {
  try {
    const p = getPool();
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    
    const sub = p.subscribeMany([url], [{ kinds: [0], limit: 1 }], {
      onevent: () => {
        clearTimeout(t);
        sub.close();
      },
      oneose: () => {
        clearTimeout(t);
        sub.close();
      }
    });
    
    await new Promise<void>((resolve, reject) => {
      controller.signal.addEventListener('abort', () => {
        sub.close();
        reject(new Error('timeout'));
      });
      setTimeout(resolve, 100); // Give it time to connect
    });
    
    return true;
  } catch {
    return false;
  }
}
