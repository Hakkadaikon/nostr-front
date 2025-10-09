/**
 * OGP画像URLのトラッキング機能
 *
 * LinkPreviewコンポーネントがOGPカードとして画像を表示した際に、
 * その画像URLを記録し、RichContentでの重複表示を防止する。
 *
 * 重要: 単独の画像URLはトラッキングしないため、
 * インライン画像表示が抑制されることはない。
 */

// OGPカードとして表示された画像URLのセット
const displayedOgpImages = new Map<string, number>();

// TTL（Time To Live）: 5分
const TTL_MS = 5 * 60 * 1000;

/**
 * OGPカードとして表示された画像URLを記録
 * @param imageUrl OGP画像のURL
 */
export function trackOgpImage(imageUrl: string): void {
  displayedOgpImages.set(imageUrl, Date.now());

  // 古いエントリを削除（メモリリーク防止）
  cleanupOldEntries();
}

/**
 * 指定されたURLがOGP画像として既に表示されているかチェック
 * @param imageUrl チェックする画像URL
 * @returns OGP画像として表示済みならtrue
 */
export function isTrackedOgpImage(imageUrl: string): boolean {
  const timestamp = displayedOgpImages.get(imageUrl);
  if (!timestamp) {
    return false;
  }

  // TTL超過チェック
  if (Date.now() - timestamp > TTL_MS) {
    displayedOgpImages.delete(imageUrl);
    return false;
  }

  return true;
}

/**
 * TTLを超過した古いエントリを削除
 */
function cleanupOldEntries(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  for (const [url, timestamp] of displayedOgpImages.entries()) {
    if (now - timestamp > TTL_MS) {
      keysToDelete.push(url);
    }
  }

  keysToDelete.forEach(url => displayedOgpImages.delete(url));
}

/**
 * 全てのトラッキングデータをクリア（テスト用）
 */
export function clearOgpImageTracking(): void {
  displayedOgpImages.clear();
}
