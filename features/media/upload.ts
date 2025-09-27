/**
 * nostr.build API を使用した画像アップロードサービス
 */

export interface UploadResult {
  url: string;
  error?: string;
}

/**
 * nostr.buildに画像をアップロード
 * @param file アップロードするファイル
 * @returns アップロードされた画像のURL
 */
export async function uploadToNostrBuild(file: File): Promise<UploadResult> {
  try {
    // ファイルサイズチェック（10MB制限）
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('ファイルサイズは10MB以下にしてください');
    }

    // サポートされているファイル形式チェック
    const SUPPORTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!SUPPORTED_TYPES.includes(file.type)) {
      throw new Error('サポートされていないファイル形式です（JPEG, PNG, GIF, WebPのみ）');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://nostr.build/api/v2/upload/files', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed:', response.status, errorText);
      throw new Error(`アップロードに失敗しました: ${response.statusText}`);
    }

    const data = await response.json();

    // レスポンスの形式を確認
    if (data.status === 'success' && data.data) {
      // 複数のURLが返される場合は最初のものを使用
      if (Array.isArray(data.data)) {
        const firstItem = data.data[0];
        if (firstItem && firstItem.url) {
          return { url: firstItem.url };
        }
      }
      // 単一のURLの場合
      if (data.data.url) {
        return { url: data.data.url };
      }
    }

    // 旧形式のレスポンス対応
    if (data.url) {
      return { url: data.url };
    }

    // URLがデータ配列の場合
    if (Array.isArray(data) && data.length > 0 && data[0].url) {
      return { url: data[0].url };
    }

    throw new Error('予期しないレスポンス形式です');
  } catch (error) {
    console.error('Upload error:', error);
    return {
      url: '',
      error: error instanceof Error ? error.message : '画像のアップロードに失敗しました',
    };
  }
}

/**
 * 複数の画像を並行してアップロード
 * @param files アップロードするファイルの配列
 * @returns アップロードされた画像のURL配列
 */
export async function uploadMultipleImages(files: File[]): Promise<string[]> {
  const uploadPromises = files.map(file => uploadToNostrBuild(file));
  const results = await Promise.all(uploadPromises);

  const urls: string[] = [];
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.url) {
      urls.push(result.url);
    } else if (result.error) {
      errors.push(`ファイル ${files[index].name}: ${result.error}`);
    }
  });

  if (errors.length > 0 && urls.length === 0) {
    throw new Error(errors.join('\n'));
  }

  return urls;
}