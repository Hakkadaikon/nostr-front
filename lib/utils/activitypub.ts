import { User } from '../../features/timeline/types';
import { Event as NostrEvent } from 'nostr-tools';

/**
 * ユーザーがActivityPubブリッジ経由かどうかを判定
 */
export function isActivityPubUser(user: User | undefined): boolean {
  if (!user) return false;
  
  // mostr.pubドメインのチェック（nip05）
  if (user.nip05) {
    // _@mostr.pub形式もチェック
    if (user.nip05.includes('mostr.pub') || user.nip05 === '_@mostr.pub') {
      return true;
    }
  }
  
  // websiteフィールドのチェック（ActivityPubプロフィールURL）
  if (user.website) {
    const websiteLower = user.website.toLowerCase();
    if (
      websiteLower.includes('mostr.pub') ||
      // ActivityPubのプロフィールURLパターン
      /https?:\/\/[^\/]+\/@[^\/]+/.test(user.website) || // https://instance.com/@username
      /https?:\/\/[^\/]+\/users\/[^\/]+/.test(user.website) || // https://instance.com/users/username
      // 一般的なActivityPubインスタンス
      websiteLower.includes('mastodon') ||
      websiteLower.includes('misskey') ||
      websiteLower.includes('pleroma') ||
      websiteLower.includes('pixelfed') ||
      websiteLower.includes('peertube')
    ) {
      return true;
    }
  }
  
  // ユーザー名が@username@domain形式かチェック
  if (user.username) {
    // @username@domain.com形式
    if (/^@.+@.+\..+$/.test(user.username)) {
      return true;
    }
    // username@domain.com形式（@なし）
    if (/^[^@]+@[^@]+\.[^@]+$/.test(user.username) && !user.username.includes('nostr:')) {
      return true;
    }
  }
  
  // 名前フィールドに@username@domain形式が含まれるかチェック
  if (user.name && /@.+@.+\..+/.test(user.name)) {
    return true;
  }
  
  // bioにActivityPub関連の記述があるかチェック
  if (user.bio) {
    const bioLower = user.bio.toLowerCase();
    if (
      bioLower.includes('activitypub') ||
      bioLower.includes('mastodon') ||
      bioLower.includes('misskey') ||
      bioLower.includes('pleroma') ||
      bioLower.includes('pixelfed') ||
      bioLower.includes('peertube') ||
      bioLower.includes('bridged from') ||
      bioLower.includes('mostr.pub') ||
      bioLower.includes('fediverse') ||
      // URLパターンのチェック
      /https?:\/\/[^\/]+\/@[^\/]+/.test(user.bio) || // https://instance.com/@username
      /https?:\/\/[^\/]+\/users\/[^\/]+/.test(user.bio) // https://instance.com/users/username
    ) {
      return true;
    }
  }
  
  return false;
}

/**
 * NostrイベントがActivityPubブリッジ経由かどうかを判定
 */
export function isActivityPubEvent(event: NostrEvent | undefined): boolean {
  if (!event) return false;
  
  // mostr.pubのタグをチェック
  const mostrTag = event.tags.find(tag => tag[0] === 'mostr' || (tag[0] === 'r' && tag[1]?.includes('mostr.pub')));
  if (mostrTag) {
    return true;
  }
  
  // プロキシタグをチェック
  const proxyTag = event.tags.find(tag => tag[0] === 'proxy' && tag[1]?.includes('activitypub'));
  if (proxyTag) {
    return true;
  }
  
  return false;
}