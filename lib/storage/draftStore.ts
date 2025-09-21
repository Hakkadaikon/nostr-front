import { getStorage } from './index';

const PREFIX = 'draft:';

export async function saveDraft(key: string, value: string) {
  await getStorage().setItem(PREFIX + key, { value, ts: Date.now() });
}
export async function loadDraft(key: string) {
  const data = await getStorage().getItem<{ value: string; ts: number }>(PREFIX + key);
  return data?.value ?? null;
}
export async function removeDraft(key: string) {
  await getStorage().removeItem(PREFIX + key);
}
