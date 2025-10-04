import localforage from 'localforage';

const ANALYTICS_ENABLED = (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS || 'false') === 'true';

export const logger = {
  warn: (...args: unknown[]) => console.warn('[warn]', ...args),
  error: (...args: unknown[]) => console.error('[error]', ...args),
};

type Metric = { ts: number; type: 'publish' | 'sign_error'; payload: any };

export async function recordPublishResult(data: { relay: string; ok: boolean; error?: unknown }) {
  if (!ANALYTICS_ENABLED) return;
  const m: Metric = { ts: Date.now(), type: 'publish', payload: data };
  const key = 'metrics:events';
  const arr = ((await localforage.getItem<Metric[]>(key)) || []);
  arr.push(m);
  await localforage.setItem(key, arr);
}

export async function recordSignError(error: unknown) {
  if (!ANALYTICS_ENABLED) return;
  const m: Metric = { ts: Date.now(), type: 'sign_error', payload: { message: String(error) } };
  const key = 'metrics:events';
  const arr = ((await localforage.getItem<Metric[]>(key)) || []);
  arr.push(m);
  await localforage.setItem(key, arr);
}
