import { useAuthStore } from '../../stores/auth.store';
import { useFollowCacheStore } from '../../stores/follow-cache.store';

/**
 * 指定された pubkey が現在のユーザーのフォローリストに含まれているかを判定
 *
 * @param targetPubkey - 判定対象のユーザーの公開鍵（hex形式）
 * @returns フォロー中: true, 非フォロー: false, 判定不能（未ログイン等）: null
 */
export function isFollowing(targetPubkey: string | undefined): boolean | null {
  // 対象 pubkey が未定義の場合
  if (!targetPubkey) {
    return null;
  }

  // 現在のユーザーの公開鍵を取得
  const currentUserPubkey = useAuthStore.getState().publicKey;

  // 未ログインの場合は判定不能
  if (!currentUserPubkey) {
    return null;
  }

  // 自分自身の投稿は常に表示（フォロー扱い）
  if (currentUserPubkey === targetPubkey) {
    return true;
  }

  // フォローリストをキャッシュから取得
  const followCache = useFollowCacheStore.getState().getFollowList(currentUserPubkey);

  // フォローリストが取得できない場合は判定不能
  if (!followCache) {
    return null;
  }

  // Set を使用して O(1) で判定
  const followSet = new Set(followCache.followList);
  return followSet.has(targetPubkey);
}

/**
 * 複数の pubkey に対してフォロー判定を一括で行う（パフォーマンス最適化版）
 *
 * @param targetPubkeys - 判定対象のユーザーの公開鍵リスト（hex形式）
 * @returns Map<pubkey, isFollowing>
 */
export function isFollowingBatch(targetPubkeys: string[]): Map<string, boolean | null> {
  const result = new Map<string, boolean | null>();

  // 現在のユーザーの公開鍵を取得
  const currentUserPubkey = useAuthStore.getState().publicKey;

  // 未ログインの場合は全て判定不能
  if (!currentUserPubkey) {
    targetPubkeys.forEach(pubkey => result.set(pubkey, null));
    return result;
  }

  // フォローリストをキャッシュから取得
  const followCache = useFollowCacheStore.getState().getFollowList(currentUserPubkey);

  // フォローリストが取得できない場合は全て判定不能
  if (!followCache) {
    targetPubkeys.forEach(pubkey => result.set(pubkey, null));
    return result;
  }

  // Set を使用して O(1) で判定
  const followSet = new Set(followCache.followList);

  targetPubkeys.forEach(pubkey => {
    // 自分自身の投稿は常に表示
    if (currentUserPubkey === pubkey) {
      result.set(pubkey, true);
    } else {
      result.set(pubkey, followSet.has(pubkey));
    }
  });

  return result;
}
