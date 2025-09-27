import { signEvent } from '../../lib/nostr/signatures';
import { useAuthStore } from '../../stores/auth.store';
import type { Event as NostrEvent } from 'nostr-tools';

/**
 * 画像アップロードサービス (NIP-96 + NIP-98 対応)
 *
 * デフォルトでは nostrcheck.me にアップロードし、失敗時にフォールバックを試みる。
 * アップロードには NIP-98 署名が必須のため、NIP-07 拡張または秘密鍵ログインが必要。
 */

export interface UploadResult {
  url: string;
  error?: string;
}

const DEFAULT_NIP96_ENDPOINT =
  process.env.NEXT_PUBLIC_NIP96_UPLOAD_URL || 'https://nostrcheck.me/api/v1/media';

const NOSTR_BUILD_ENDPOINT =
  process.env.NEXT_PUBLIC_NOSTR_BUILD_UPLOAD_URL || 'https://nostr.build/api/v2/upload/files';

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

async function sha256HexFromFile(file: File): Promise<string | undefined> {
  try {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      return undefined;
    }

    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return bufferToHex(digest);
  } catch (error) {
    console.warn('[upload] Failed to calculate payload hash:', error);
    return undefined;
  }
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
  payloadHash?: string,
): Promise<string> {
  const { nsec, publicKey } = useAuthStore.getState();
  const event: Omit<NostrEvent, 'id' | 'sig'> = {
    kind: 27235,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['u', url],
      ['method', method.toUpperCase()],
    ],
    content: '',
    pubkey: publicKey ?? '',
  };

  if (payloadHash) {
    event.tags.push(['payload', payloadHash]);
  }

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

  const payloadHash = await sha256HexFromFile(file);
  const authorization = await createNip98AuthorizationHeader(url, 'POST', payloadHash);

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
      data?.url || data?.data?.url || data?.result?.url || data?.nip94_event?.url;

    if (urlFromJson) {
      return { url: urlFromJson };
    }

    throw new Error('APIレスポンスに画像URLが含まれていません');
  }

  const text = await response.text();
  if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
    return { url: text.trim() };
  }

  throw new Error('予期しないレスポンス形式です');
}

async function uploadToNostrCheck(file: File): Promise<UploadResult> {
  return uploadViaNip96({
    file,
    url: DEFAULT_NIP96_ENDPOINT,
    fieldName: 'mediafile',
    extraFields: {
      uploadtype: 'media',
      size: file.size.toString(),
      content_type: file.type || 'application/octet-stream',
    },
  });
}

async function uploadToNostrBuild(file: File): Promise<UploadResult> {
  return uploadViaNip96({
    file,
    url: NOSTR_BUILD_ENDPOINT,
    fieldName: 'file',
    extraFields: {
      size: file.size.toString(),
      content_type: file.type || 'application/octet-stream',
    },
  });
}

async function uploadToImgur(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('https://api.imgur.com/3/image', {
    method: 'POST',
    headers: {
      Authorization: 'Client-ID a0113a6e320c92e',
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Imgur upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.success && data.data && data.data.link) {
    return { url: data.data.link };
  }

  throw new Error('Imgur APIレスポンスエラー');
}

async function uploadWithFallbacks(file: File): Promise<string> {
  const attempts: Array<() => Promise<UploadResult>> = [
    () => uploadToNostrCheck(file),
    () => uploadToNostrBuild(file),
    () => uploadToImgur(file),
  ];

  const errors: string[] = [];

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      if (result.url) {
        return result.url;
      }
      if (result.error) {
        errors.push(result.error);
      }
    } catch (error) {
      errors.push(getErrorMessage(error));
    }
  }

  throw new Error(errors.join('\\n'));
}

export async function uploadMultipleImages(files: File[]): Promise<string[]> {
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        const url = await uploadWithFallbacks(file);
        return { url };
      } catch (error) {
        return { error: `ファイル ${file.name}: ${getErrorMessage(error)}` };
      }
    }),
  );

  const urls = results.filter((r) => r.url).map((r) => r.url!) as string[];
  const errors = results.filter((r) => r.error).map((r) => r.error!);

  if (errors.length > 0 && urls.length === 0) {
    throw new Error(errors.join('\\n'));
  }

  if (errors.length > 0) {
    console.warn('[upload] Some files failed to upload:', errors);
  }

  return urls;
}
