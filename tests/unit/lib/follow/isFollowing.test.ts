import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isFollowing, isFollowingBatch } from '../../../../lib/follow/isFollowing';
import { useAuthStore } from '../../../../stores/auth.store';
import { useFollowCacheStore } from '../../../../stores/follow-cache.store';

// Zustand ストアをモック
vi.mock('../../../../stores/auth.store');
vi.mock('../../../../stores/follow-cache.store');

describe('isFollowing', () => {
  const mockCurrentUserPubkey = 'current-user-pubkey';
  const mockTargetPubkey = 'target-user-pubkey';
  const mockFollowList = ['following-user-1', 'following-user-2', mockTargetPubkey];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本的な判定', () => {
    it('フォロー中のユーザーに対して true を返す', () => {
      // Auth Store のモック
      vi.mocked(useAuthStore.getState).mockReturnValue({
        publicKey: mockCurrentUserPubkey,
      } as any);

      // Follow Cache Store のモック
      vi.mocked(useFollowCacheStore.getState).mockReturnValue({
        getFollowList: vi.fn().mockReturnValue({
          followList: mockFollowList,
          kind: 3,
        }),
      } as any);

      const result = isFollowing(mockTargetPubkey);
      expect(result).toBe(true);
    });

    it('非フォローのユーザーに対して false を返す', () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        publicKey: mockCurrentUserPubkey,
      } as any);

      vi.mocked(useFollowCacheStore.getState).mockReturnValue({
        getFollowList: vi.fn().mockReturnValue({
          followList: mockFollowList,
          kind: 3,
        }),
      } as any);

      const result = isFollowing('non-following-user-pubkey');
      expect(result).toBe(false);
    });

    it('自分自身に対して true を返す', () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        publicKey: mockCurrentUserPubkey,
      } as any);

      vi.mocked(useFollowCacheStore.getState).mockReturnValue({
        getFollowList: vi.fn().mockReturnValue({
          followList: mockFollowList,
          kind: 3,
        }),
      } as any);

      const result = isFollowing(mockCurrentUserPubkey);
      expect(result).toBe(true);
    });
  });

  describe('エッジケース', () => {
    it('対象 pubkey が undefined の場合 null を返す', () => {
      const result = isFollowing(undefined);
      expect(result).toBe(null);
    });

    it('未ログインの場合 null を返す', () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        publicKey: null,
      } as any);

      const result = isFollowing(mockTargetPubkey);
      expect(result).toBe(null);
    });

    it('フォローリストが取得できない場合 null を返す', () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        publicKey: mockCurrentUserPubkey,
      } as any);

      vi.mocked(useFollowCacheStore.getState).mockReturnValue({
        getFollowList: vi.fn().mockReturnValue(null),
      } as any);

      const result = isFollowing(mockTargetPubkey);
      expect(result).toBe(null);
    });
  });
});

describe('isFollowingBatch', () => {
  const mockCurrentUserPubkey = 'current-user-pubkey';
  const mockFollowList = ['user-1', 'user-2', 'user-3'];
  const mockTargetPubkeys = ['user-1', 'user-4', mockCurrentUserPubkey];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('複数のユーザーに対して正しく判定する', () => {
    vi.mocked(useAuthStore.getState).mockReturnValue({
      publicKey: mockCurrentUserPubkey,
    } as any);

    vi.mocked(useFollowCacheStore.getState).mockReturnValue({
      getFollowList: vi.fn().mockReturnValue({
        followList: mockFollowList,
        kind: 3,
      }),
    } as any);

    const result = isFollowingBatch(mockTargetPubkeys);

    expect(result.get('user-1')).toBe(true); // フォロー中
    expect(result.get('user-4')).toBe(false); // 非フォロー
    expect(result.get(mockCurrentUserPubkey)).toBe(true); // 自分自身
  });

  it('未ログインの場合、全て null を返す', () => {
    vi.mocked(useAuthStore.getState).mockReturnValue({
      publicKey: null,
    } as any);

    const result = isFollowingBatch(mockTargetPubkeys);

    expect(result.get('user-1')).toBe(null);
    expect(result.get('user-4')).toBe(null);
    expect(result.get(mockCurrentUserPubkey)).toBe(null);
  });

  it('フォローリストが取得できない場合、全て null を返す', () => {
    vi.mocked(useAuthStore.getState).mockReturnValue({
      publicKey: mockCurrentUserPubkey,
    } as any);

    vi.mocked(useFollowCacheStore.getState).mockReturnValue({
      getFollowList: vi.fn().mockReturnValue(null),
    } as any);

    const result = isFollowingBatch(mockTargetPubkeys);

    expect(result.get('user-1')).toBe(null);
    expect(result.get('user-4')).toBe(null);
    expect(result.get(mockCurrentUserPubkey)).toBe(null);
  });
});
