// NIP-18 repost/quote helpers
// Repost: kind=6 with 'e' (target) and 'p' (author) tags
// Quote: kind=1 with content including a nostr:nevent link and tags referencing target

import { encodeNevent } from './nip19';

export type Tag = string[];

export function buildRepostTags(targetEventId: string, targetAuthor?: string, relays?: string[]): Tag[] {
  const tags: Tag[] = [['e', targetEventId, relays?.[0] || '']];
  if (targetAuthor) tags.push(['p', targetAuthor]);
  return tags;
}

export function buildQuote(targetEventId: string, relays?: string[], author?: string) {
  const nevent = encodeNevent(targetEventId, relays, author);
  const content = `nostr:${nevent}`;
  const tags: Tag[] = [['e', targetEventId, relays?.[0] || '']];
  if (author) tags.push(['p', author]);
  return { content, tags };
}
