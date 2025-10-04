/**
 * 安全に日付をタイムスタンプ（ミリ秒）に変換する
 * Date、number、stringのいずれの型にも対応
 */
export function toTimestamp(value: Date | number | string | undefined | null): number {
  if (value == null) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const timestamp = Date.parse(value);
    return isNaN(timestamp) ? 0 : timestamp;
  }
  return 0;
}
