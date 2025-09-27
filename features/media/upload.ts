/**
 * nostr.build API を使用した画像アップロードサービス
 *
 * 注意: nostr.buildの無料APIには以下の制限があります:
 * - ファイルサイズ: 最大10MB
 * - 対応形式: JPEG, PNG, GIF, WebP
 * - CORSポリシー: ブラウザから直接アクセス可能
 */

export interface UploadResult {
  url: string;
  error?: string;
}

/**
 * void.catに画像をアップロード（Nostr向けサービス）
 */
async function uploadToVoidCat(file: File): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://void.cat/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`void.cat upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('void.cat response:', data);

    if (data.ok && data.file) {
      // void.catのレスポンス形式: { ok: true, file: { id: "xxx", ... } }
      const fileId = data.file.id || data.file;
      return { url: `https://void.cat/d/${fileId}` };
    }

    throw new Error('void.cat APIレスポンスエラー');
  } catch (error) {
    console.error('void.cat upload error:', error);
    throw error;
  }
}

/**
 * imgurに画像をアップロード（フォールバック用）
 */
async function uploadToImgur(file: File): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('image', file);

    // Imgur Anonymous Upload API (Client ID不要)
    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': 'Client-ID a0113a6e320c92e' // Public Client ID for anonymous uploads
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
  } catch (error) {
    console.error('Imgur upload error:', error);
    throw error;
  }
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

    // nostr.build の無料APIエンドポイントを使用
    const response = await fetch('https://nostr.build/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed:', response.status, errorText);
      throw new Error(`アップロードに失敗しました: ${response.statusText}`);
    }

    // レスポンスのContent-Typeを確認
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Upload response:', data);

      // nostr.build APIのレスポンス形式に対応
      // 成功時: { "status": "success", "nip94_event": {...}, "url": "https://..." }
      if (data.status === 'success' && data.url) {
        return { url: data.url };
      }

      // 他の形式のレスポンスも試す
      if (data.data && data.data.url) {
        return { url: data.data.url };
      }

      if (Array.isArray(data) && data.length > 0 && data[0].url) {
        return { url: data[0].url };
      }

      throw new Error('APIレスポンスにURLが含まれていません');
    } else {
      // テキストレスポンスの場合（URLが直接返される場合）
      const text = await response.text();
      console.log('Upload response (text):', text);

      // URLパターンをチェック
      if (text.startsWith('http://') || text.startsWith('https://')) {
        return { url: text.trim() };
      }

      throw new Error('予期しないレスポンス形式です');
    }
  } catch (error) {
    console.error('Nostr.build upload error:', error);

    // nostr.buildが失敗した場合、他のサービスにフォールバック
    // 1. まずvoid.catを試す
    try {
      console.log('Trying void.cat...');
      return await uploadToVoidCat(file);
    } catch (voidCatError) {
      console.error('void.cat also failed:', voidCatError);

      // 2. 最後にimgurを試す
      try {
        console.log('Trying imgur as last resort...');
        return await uploadToImgur(file);
      } catch (imgurError) {
        console.error('All upload services failed');
        return {
          url: '',
          error: '画像のアップロードに失敗しました。しばらく時間をおいて再度お試しください。',
        };
      }
    }
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