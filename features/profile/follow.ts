import { SimplePool, type Event as NostrEvent, nip19, finalizeEvent } from 'nostr-tools';
import { publish, subscribe } from '../../lib/nostr/client';
import { useRelaysStore } from '../../stores/relays.store';
import { useAuthStore } from '../../stores/auth.store';
import { KIND_FOLLOW } from '../../lib/nostr/constants';
import { fetchFollowList } from '../follow/services/follow';
import { User } from '../timeline/types';
import { fetchProfileForNotification } from './services/profile-cache';
import { getProfileImageUrl } from '../../lib/utils/avatar';

export interface FollowList {
  pubkeys: string[];
  tags: string[][];
}

/**
 * Follow a user by adding their pubkey to the contact list (kind 3)
 */
export async function followUser(targetNpubOrPubkey: string): Promise<void> {
  try {
    // targetをpubkeyに変換
    let targetPubkey = targetNpubOrPubkey;
    if (targetNpubOrPubkey.startsWith('npub')) {
      const decoded = nip19.decode(targetNpubOrPubkey);
      if (decoded.type === 'npub') {
        targetPubkey = decoded.data as string;
      }
    }

    // 現在のフォローリストを取得
    const currentFollowList = await fetchFollowList();
    
    // すでにフォローしているかチェック
    if (currentFollowList.includes(targetPubkey)) {
      return;
    }
    
    // 新しいフォローリストを作成
    const newFollowList = [...currentFollowList, targetPubkey];
    const tags = newFollowList.map(pk => ['p', pk]);
    
    // リレーの設定を取得
    let relays = useRelaysStore.getState().relays.filter(r => r.write).map(r => r.url);
    if (relays.length === 0) {
      const defaultRelays = process.env.NEXT_PUBLIC_DEFAULT_RELAYS;
      if (defaultRelays) {
        relays = defaultRelays.split(',').map(url => url.trim());
      } else {
        relays = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.nostr.band'];
      }
    }
    
    // イベントを作成
    const unsignedEvent = {
      kind: KIND_FOLLOW,
      content: '',
      tags,
      created_at: Math.floor(Date.now() / 1000),
      pubkey: '', // これは署名時に設定される
    };
    
    // Nip07で署名
    if (window.nostr) {
      const signedEvent = await window.nostr.signEvent(unsignedEvent);
      await publish(relays, signedEvent as NostrEvent);
    } else {
      throw new Error('Nostr extension not found');
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Unfollow a user by removing their pubkey from the contact list
 */
export async function unfollowUser(targetNpubOrPubkey: string): Promise<void> {
  try {
    // targetをpubkeyに変換
    let targetPubkey = targetNpubOrPubkey;
    if (targetNpubOrPubkey.startsWith('npub')) {
      const decoded = nip19.decode(targetNpubOrPubkey);
      if (decoded.type === 'npub') {
        targetPubkey = decoded.data as string;
      }
    }

    // 現在のフォローリストを取得
    const currentFollowList = await fetchFollowList();
    
    // フォローしていないかチェック
    if (!currentFollowList.includes(targetPubkey)) {
      return;
    }
    
    // 新しいフォローリストを作成（対象を除外）
    const newFollowList = currentFollowList.filter(pk => pk !== targetPubkey);
    const tags = newFollowList.map(pk => ['p', pk]);
    
    // リレーの設定を取得
    let relays = useRelaysStore.getState().relays.filter(r => r.write).map(r => r.url);
    if (relays.length === 0) {
      const defaultRelays = process.env.NEXT_PUBLIC_DEFAULT_RELAYS;
      if (defaultRelays) {
        relays = defaultRelays.split(',').map(url => url.trim());
      } else {
        relays = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.nostr.band'];
      }
    }
    
    // イベントを作成
    const unsignedEvent = {
      kind: KIND_FOLLOW,
      content: '',
      tags,
      created_at: Math.floor(Date.now() / 1000),
      pubkey: '', // これは署名時に設定される
    };
    
    // Nip07で署名
    if (window.nostr) {
      const signedEvent = await window.nostr.signEvent(unsignedEvent);
      await publish(relays, signedEvent as NostrEvent);
    } else {
      throw new Error('Nostr extension not found');
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Check if the current user is following a target user
 */
export async function isFollowing(targetNpubOrPubkey: string): Promise<boolean> {
  try {
    // targetをpubkeyに変換
    let targetPubkey = targetNpubOrPubkey;
    if (targetNpubOrPubkey.startsWith('npub')) {
      const decoded = nip19.decode(targetNpubOrPubkey);
      if (decoded.type === 'npub') {
        targetPubkey = decoded.data as string;
      }
    }
    
    // 現在のフォローリストを取得
    const currentFollowList = await fetchFollowList();
    return currentFollowList.includes(targetPubkey);
  } catch (error) {
    return false;
  }
}

/**
 * 特定ユーザーのフォロー/フォロワー一覧を取得
 */
export async function fetchUserFollowList(pubkey: string, type: 'following' | 'followers'): Promise<User[]> {
  try {
    const relays = useRelaysStore.getState().relays.filter(r => r.read).map(r => r.url);
    
    if (relays.length === 0) {
      return [];
    }

    if (type === 'following') {
      // フォロー中のユーザーを取得（kind:3）
      return new Promise((resolve) => {
        const users: User[] = [];
        const userMap = new Map<string, User>();
        
        const timeout = setTimeout(() => {
          sub.close();
          resolve(Array.from(userMap.values()));
        }, 3000);

        const sub = subscribe(
          relays,
          [{ kinds: [KIND_FOLLOW], authors: [pubkey], limit: 1 }],
          async (event: NostrEvent) => {
            // kind:3のpタグからフォロー中のpubkeyリストを取得
            const followingPubkeys = event.tags
              .filter(tag => tag[0] === 'p' && tag[1])
              .map(tag => tag[1]);
            
            // フォロー中のユーザーのプロフィールを取得
            if (followingPubkeys.length > 0) {
              const profileSub = subscribe(
                relays,
                [{ kinds: [0], authors: followingPubkeys }],
                async (profileEvent: NostrEvent) => {
                  try {
                    const content = JSON.parse(profileEvent.content);
                    const npub = nip19.npubEncode(profileEvent.pubkey);
                    const user: User = {
                      id: profileEvent.pubkey,
                      username: content.username || content.name || 'nostr:' + profileEvent.pubkey.slice(0, 8),
                      name: content.display_name || content.name || '',
                      avatar: getProfileImageUrl(content.picture, profileEvent.pubkey),
                      bio: content.about || '',
                      followersCount: 0,
                      followingCount: 0,
                      createdAt: new Date(profileEvent.created_at * 1000),
                      npub,
                    };
                    userMap.set(profileEvent.pubkey, user);
                  } catch (error) {
                  }
                }
              );

              // プロフィール取得のタイムアウト
              setTimeout(() => {
                profileSub.close();
                clearTimeout(timeout);
                resolve(Array.from(userMap.values()));
              }, 2000);
            } else {
              clearTimeout(timeout);
              sub.close();
              resolve([]);
            }
          }
        );
      });
    } else {
      // フォロワーを取得（自分をpタグに含むkind:3イベントを探す）
      return new Promise((resolve) => {
        const userMap = new Map<string, User>();
        
        const timeout = setTimeout(() => {
          sub.close();
          resolve(Array.from(userMap.values()));
        }, 5000);

        // 自分をフォローしているユーザーを検索
        const sub = subscribe(
          relays,
          [{ kinds: [KIND_FOLLOW], '#p': [pubkey] }],
          async (event: NostrEvent) => {
            // このイベントの作者がフォロワー
            const followerPubkey = event.pubkey;
            
            // フォロワーのプロフィールを取得
            try {
              const profile = await fetchProfileForNotification(followerPubkey);
              const user: User = {
                id: profile.id,
                username: profile.username,
                name: profile.name,
                avatar: profile.avatar,
                bio: '',
                followersCount: 0,
                followingCount: 0,
                createdAt: new Date(),
                npub: profile.npub,
              };
              userMap.set(followerPubkey, user);
            } catch (error) {
            }
          }
        );
      });
    }
  } catch (error) {
    return [];
  }
}