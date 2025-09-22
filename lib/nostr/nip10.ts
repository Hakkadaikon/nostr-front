// NIP-10 helpers: build e/p tags and root/reply markers
// e tag: ['e', <event-id>, <relay-url?>, <marker?>]
// p tag: ['p', <pubkey>, <relay-url?>]
export type Tag = string[];

export type ReplyInput = {
  rootId?: string; // root of the thread
  replyToId?: string; // direct parent
  rootRelay?: string;
  replyRelay?: string;
  rootAuthor?: string; // hex pubkey
  replyAuthor?: string; // hex pubkey
};

export function buildReplyTags(input: ReplyInput) {
  const tags: Tag[] = [];
  
  // リプライの場合、rootIdがない場合はreplyToIdをrootとして扱う
  if (!input.rootId && input.replyToId) {
    // 最初の返信の場合、replyToIdがroot投稿
    tags.push(['e', input.replyToId, input.replyRelay || '', 'root']);
    if (input.replyAuthor) tags.push(['p', input.replyAuthor]);
  } else {
    // スレッドの続きの場合
    if (input.rootId) {
      tags.push(['e', input.rootId, input.rootRelay || '', 'root']);
      if (input.rootAuthor) tags.push(['p', input.rootAuthor]);
    }
    if (input.replyToId && input.replyToId !== input.rootId) {
      tags.push(['e', input.replyToId, input.replyRelay || '', 'reply']);
      if (input.replyAuthor && input.replyAuthor !== input.rootAuthor) {
        tags.push(['p', input.replyAuthor]);
      }
    }
  }
  
  return tags;
}

export function extractMarkers(tags: Tag[]) {
  const out: { root?: string; reply?: string } = {};
  for (const t of tags) {
    if (t[0] === 'e' && t[3] === 'root') out.root = t[1];
    if (t[0] === 'e' && t[3] === 'reply') out.reply = t[1];
  }
  return out;
}
