import { Notification } from '../../../types/notification';

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'like',
    user: {
      id: 'user-1',
      name: 'さくら',
      username: 'sakura',
      avatar: 'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=sakura',
      npub: 'npub1hrsv9c50k0e9w6dncnxt7cvxjyv02l3dfgljr27t46dn6fptph9s8crx2h',
      pubkey: 'b8e1057287b1f25766d3c9997ec18926219eafc46a25e453e5d5b3d485613ca5'
    },
    postId: 'post-1',
    postContent: 'おはようございます！今日もいい天気ですね☀️',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30分前
  },
  {
    id: 'notif-2',
    type: 'reply',
    user: {
      id: 'user-2',
      name: 'たろう',
      username: 'taro',
      avatar: 'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=taro',
      npub: 'npub1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9e8jmn',
      pubkey: '0000000000000000000000000000000000000000000000000000000000000000'
    },
    postId: 'post-2',
    postContent: 'Nostr楽しいですね！',
    content: '確かに楽しいです！一緒に頑張りましょう💪',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2時間前
  },
  {
    id: 'notif-3',
    type: 'mention',
    user: {
      id: 'user-3',
      name: '発火大根 a.k.a. radish on fire🔥',
      username: 'radish',
      avatar: 'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=radish',
      npub: 'npub1a2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0',
      pubkey: 'a2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d000'
    },
    content: 'claude code3並列で nostr:npub1hrsv9c50k0e9w6dncnxt7cvxjyv02l3dfgljr27t46dn6fptph9s8crx2h さんに直してもらった結果、NostterをパクったようなUIができている nostr:nevent1qvzqqqqqqypzqyqmxrhg3sn6z00x30mu3srrdr4ru05rweq4jhqcvat805v2g6j9qyxhwumn8ghj7u3wddhk56tjvyhxjmcpypmhxue69uhhyetvv9uj66ns9ehx7um5wgh8w6tjv4jxuet59e48',
    postId: 'post-3',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 13) // 13時間前
  },
  {
    id: 'notif-4',
    type: 'repost',
    user: {
      id: 'user-4',
      name: 'はなこ',
      username: 'hanako',
      avatar: 'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=hanako',
      npub: 'npub1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d1',
      pubkey: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d111'
    },
    postId: 'post-4',
    postContent: 'https://i.imgur.com/example.jpg これ見てください！',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 24時間前
  },
  {
    id: 'notif-5',
    type: 'zap',
    user: {
      id: 'user-5',
      name: 'Lightning⚡',
      username: 'lightning',
      avatar: 'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=lightning',
      npub: 'npub1c2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d2',
      pubkey: 'c2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d222'
    },
    postId: 'post-5',
    amount: 1000,
    content: 'いい投稿でした！⚡',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3) // 3時間前
  },
  {
    id: 'notif-6',
    type: 'follow',
    user: {
      id: 'user-6',
      name: '新しいフォロワー',
      username: 'newfollower',
      avatar: 'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=newfollower',
      npub: 'npub1d2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d3',
      pubkey: 'd2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d333'
    },
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15) // 15分前
  }
];

export const mockMediaUrls = {
  youtube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  youtubeShort: 'https://youtu.be/dQw4w9WgXcQ',
  x: 'https://x.com/jack/status/20',
  twitter: 'https://twitter.com/jack/status/20',
  spotify: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC',
  spotifyAlbum: 'https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3',
  applePodcast: 'https://podcasts.apple.com/us/podcast/the-daily/id1200361736',
  image: 'https://i.imgur.com/test-image.jpg',
  gif: 'https://media.giphy.com/media/test/giphy.gif'
};