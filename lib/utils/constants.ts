export const KINDS = { NOTE: 1, REPOST: 6 } as const;
export const DEFAULT_RELAYS = (process.env.NEXT_PUBLIC_DEFAULT_RELAYS || '').split(',').filter(Boolean);
