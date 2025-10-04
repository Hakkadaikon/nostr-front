import { signEvent } from '../../lib/nostr/signatures';
import { useAuthStore } from '../../stores/auth.store';
import type { Event as NostrEvent } from 'nostr-tools';

/**
 * 画像アップロードサービス (NIP-96 + NIP-98 対応)
 *
 * デフォルトでは nostrcheck.me にアップロードする。アップロードには NIP-98 署名が必須のため、
 * NIP-07 対応拡張または秘密鍵ログインが必要。
 */

export interface UploadResult {
  url: string;
  error?: string;
}

const DEFAULT_NIP96_ENDPOINT =
  process.env.NEXT_PUBLIC_NIP96_UPLOAD_URL || 'https://nostrcheck.me/api/v2/media';

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function encodeBase64(str: string): string {
  if (typeof window === 'undefined') {
    const nodeBuffer = (globalThis as any).Buffer;
    if (nodeBuffer) {
      return nodeBuffer.from(str, 'utf-8').toString('base64');
    }
  }
  return btoa(unescape(encodeURIComponent(str)));
}

async function sha256HexFromString(value: string): Promise<string> {
  try {
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto?.subtle) {
      const data = new TextEncoder().encode(value);
      const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
      return bufferToHex(digest);
    }
  } catch (error) {
  }

  if (typeof window === 'undefined') {
    const { createHash } = await import('crypto');
    return createHash('sha256').update(value, 'utf8').digest('hex');
  }
  throw new Error('この環境ではSHA-256が利用できません');
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '原因不明のエラーが発生しました';
}

async function createNip98AuthorizationHeader(
  url: string,
  method: string,
  payloadData: Record<string, unknown>,
): Promise<string> {
  const { nsec, publicKey } = useAuthStore.getState();
  const payloadJson = JSON.stringify(payloadData ?? {});
  const payloadHash = await sha256HexFromString(payloadJson);

  const event: Omit<NostrEvent, 'id' | 'sig'> = {
    kind: 27235,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['u', url],
      ['method', method.toUpperCase()],
      ['payload', payloadHash],
    ],
    content: '',
    pubkey: publicKey ?? '',
  };

  const signed = await signEvent(event, nsec ? () => nsec : undefined);
  const encoded = encodeBase64(JSON.stringify(signed));
  return `Nostr ${encoded}`;
}

interface Nip96UploadOptions {
  file: File;
  url: string;
  fieldName?: string;
  extraFields?: Record<string, string>;
}

async function uploadViaNip96({
  file,
  url,
  fieldName = 'file',
  extraFields = {},
}: Nip96UploadOptions): Promise<UploadResult> {
  const formData = new FormData();
  formData.append(fieldName, file);

  for (const [key, value] of Object.entries(extraFields)) {
    formData.append(key, value);
  }

  const authorization = await createNip98AuthorizationHeader(url, 'POST', extraFields);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      Accept: 'application/json, text/plain;q=0.8, */*;q=0.1',
    },
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(
      `アップロードに失敗しました: ${response.status} ${response.statusText}${
        message ? ` - ${message}` : ''
      }`,
    );
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await response.json();
    const urlFromJson =
      data?.url || data?.data?.url || data?.result?.url;

    if (urlFromJson) {
      return { url: urlFromJson };
    }

    const nip94Url = Array.isArray(data?.nip94_event?.tags)
      ? (data.nip94_event.tags.find((tag: unknown) =>
          Array.isArray(tag) && tag.length >= 2 && tag[0] === 'url' && typeof tag[1] === 'string'
        ) as string[] | undefined)?.[1]
      : undefined;

    if (nip94Url) {
      return { url: nip94Url };
    }

    throw new Error('APIレスポンスに画像URLが含まれていません');
  }

  const text = await response.text();
  if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
    return { url: text.trim() };
  }

  throw new Error('予期しないレスポンス形式です');
}

export async function uploadMultipleImages(files: File[]): Promise<string[]> {
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        const { url } = await uploadViaNip96({ file, url: DEFAULT_NIP96_ENDPOINT });
        return { url };
      } catch (error) {
        return { error: `ファイル ${file.name}: ${getErrorMessage(error)}` };
      }
    }),
  );

  const urls = results.filter((r) => r.url).map((r) => r.url!) as string[];
  const errors = results.filter((r) => r.error).map((r) => r.error!);

  if (errors.length > 0 && urls.length === 0) {
    throw new Error(errors.join('\n'));
  }

  if (errors.length > 0) {
  }

  return urls;
}
