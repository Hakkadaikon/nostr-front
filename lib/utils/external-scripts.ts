/**
 * External script loading utilities for embed components
 */

const DEFAULT_TIMEOUT = 15000; // 15 seconds

interface ScriptConfig {
  src: string;
  globalCheck: () => boolean;
  timeout?: number;
}

// グローバルでスクリプトのロード状態を管理
const scriptPromises = new Map<string, Promise<void>>();

/**
 * Load external script with timeout and caching
 */
export function loadExternalScript(config: ScriptConfig): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  const { src, globalCheck, timeout = DEFAULT_TIMEOUT } = config;

  // すでに読み込み済み
  if (globalCheck()) {
    return Promise.resolve();
  }

  // 読み込み中
  if (scriptPromises.has(src)) {
    return scriptPromises.get(src)!;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);

    const timeoutId = setTimeout(() => {
      scriptPromises.delete(src);
      reject(new Error(`Script load timeout: ${src}`));
    }, timeout);

    const onReady = () => {
      clearTimeout(timeoutId);
      // スクリプト読み込み後、少し待ってからチェック
      let retry = 0;
      const maxRetries = 20;

      const check = () => {
        if (globalCheck()) {
          resolve();
        } else if (retry < maxRetries) {
          retry++;
          setTimeout(check, 100);
        } else {
          scriptPromises.delete(src);
          reject(new Error(`Script library not available: ${src}`));
        }
      };
      check();
    };

    if (existingScript) {
      if (globalCheck()) {
        clearTimeout(timeoutId);
        resolve();
      } else {
        onReady();
      }
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = onReady;
    script.onerror = () => {
      clearTimeout(timeoutId);
      scriptPromises.delete(src);
      reject(new Error(`Failed to load script: ${src}`));
    };
    document.head.appendChild(script);
  });

  scriptPromises.set(src, promise);
  return promise;
}

/**
 * TikTok embed script loader
 */
export function loadTikTokScript(): Promise<void> {
  return loadExternalScript({
    src: 'https://www.tiktok.com/embed.js',
    globalCheck: () => !!(window as any).tiktokEmbed?.lib,
  });
}
