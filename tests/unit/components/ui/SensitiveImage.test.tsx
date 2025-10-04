import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SensitiveImage } from '../../../../components/ui/SensitiveImage';
import { useAuthStore } from '../../../../stores/auth.store';
import { useFollowCacheStore } from '../../../../stores/follow-cache.store';
import { useImageRevealStore } from '../../../../stores/image-reveal.store';

// Zustand ストアをモック
vi.mock('../../../../stores/auth.store');
vi.mock('../../../../stores/follow-cache.store');
vi.mock('../../../../stores/image-reveal.store');

describe('SensitiveImage', () => {
  const mockCurrentUserPubkey = 'current-user-pubkey';
  const mockFollowerPubkey = 'follower-pubkey';
  const mockNonFollowerPubkey = 'non-follower-pubkey';
  const mockImageSrc = 'https://example.com/image.jpg';
  const mockFollowList = [mockFollowerPubkey];

  beforeEach(() => {
    vi.clearAllMocks();

    // デフォルトのモック設定
    vi.mocked(useAuthStore.getState).mockReturnValue({
      publicKey: mockCurrentUserPubkey,
    } as any);

    vi.mocked(useFollowCacheStore.getState).mockReturnValue({
      getFollowList: vi.fn().mockReturnValue({
        followList: mockFollowList,
        kind: 3,
      }),
    } as any);

    vi.mocked(useImageRevealStore).mockReturnValue({
      isRevealed: vi.fn().mockReturnValue(false),
      revealImage: vi.fn(),
    } as any);
  });

  describe('自分自身の投稿', () => {
    it('自分自身の投稿はぼかしなしで表示される', () => {
      render(
        <SensitiveImage
          src={mockImageSrc}
          alt="Test image"
          authorPubkey={mockCurrentUserPubkey}
        >
          <img src={mockImageSrc} alt="Test image" data-testid="test-image" />
        </SensitiveImage>
      );

      // 画像が直接表示されることを確認
      const image = screen.getByTestId('test-image');
      expect(image).toBeInTheDocument();

      // ぼかしオーバーレイが表示されないことを確認
      expect(screen.queryByText('非フォローユーザーの画像')).not.toBeInTheDocument();
      expect(screen.queryByText('画像を表示')).not.toBeInTheDocument();
    });
  });

  describe('フォロー中のユーザーの投稿', () => {
    it('フォロー中のユーザーの投稿はぼかしなしで表示される', () => {
      render(
        <SensitiveImage
          src={mockImageSrc}
          alt="Test image"
          authorPubkey={mockFollowerPubkey}
        >
          <img src={mockImageSrc} alt="Test image" data-testid="test-image" />
        </SensitiveImage>
      );

      // 画像が直接表示されることを確認
      const image = screen.getByTestId('test-image');
      expect(image).toBeInTheDocument();

      // ぼかしオーバーレイが表示されないことを確認
      expect(screen.queryByText('非フォローユーザーの画像')).not.toBeInTheDocument();
    });
  });

  describe('非フォローユーザーの投稿', () => {
    it('非フォローユーザーの投稿はぼかして表示される', () => {
      render(
        <SensitiveImage
          src={mockImageSrc}
          alt="Test image"
          authorPubkey={mockNonFollowerPubkey}
        >
          <img src={mockImageSrc} alt="Test image" data-testid="test-image" />
        </SensitiveImage>
      );

      // ぼかしオーバーレイが表示されることを確認
      expect(screen.getByText('非フォローユーザーの画像')).toBeInTheDocument();
      expect(screen.getByText('クリックして表示')).toBeInTheDocument();
      expect(screen.getByText('画像を表示')).toBeInTheDocument();
    });

    it('「画像を表示」ボタンをクリックするとぼかしが解除される', () => {
      const mockRevealImage = vi.fn();
      vi.mocked(useImageRevealStore).mockReturnValue({
        isRevealed: vi.fn().mockReturnValue(false),
        revealImage: mockRevealImage,
      } as any);

      const { rerender } = render(
        <SensitiveImage
          src={mockImageSrc}
          alt="Test image"
          authorPubkey={mockNonFollowerPubkey}
        >
          <img src={mockImageSrc} alt="Test image" data-testid="test-image" />
        </SensitiveImage>
      );

      // 「画像を表示」ボタンをクリック
      const button = screen.getByText('画像を表示');
      fireEvent.click(button);

      // revealImage が呼ばれたことを確認
      expect(mockRevealImage).toHaveBeenCalledWith(mockImageSrc);

      // isRevealed が true を返すようにモックを更新
      vi.mocked(useImageRevealStore).mockReturnValue({
        isRevealed: vi.fn().mockReturnValue(true),
        revealImage: mockRevealImage,
      } as any);

      // 再レンダリング
      rerender(
        <SensitiveImage
          src={mockImageSrc}
          alt="Test image"
          authorPubkey={mockNonFollowerPubkey}
        >
          <img src={mockImageSrc} alt="Test image" data-testid="test-image" />
        </SensitiveImage>
      );

      // ぼかしオーバーレイが消えることを確認
      expect(screen.queryByText('非フォローユーザーの画像')).not.toBeInTheDocument();
    });
  });

  describe('エッジケース', () => {
    it('authorPubkey が undefined の場合はぼかして表示される', () => {
      render(
        <SensitiveImage
          src={mockImageSrc}
          alt="Test image"
          authorPubkey={undefined}
        >
          <img src={mockImageSrc} alt="Test image" data-testid="test-image" />
        </SensitiveImage>
      );

      // ぼかしオーバーレイが表示されることを確認（安全側）
      expect(screen.getByText('非フォローユーザーの画像')).toBeInTheDocument();
    });

    it('未ログイン状態ではぼかして表示される', () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        publicKey: null,
      } as any);

      render(
        <SensitiveImage
          src={mockImageSrc}
          alt="Test image"
          authorPubkey={mockFollowerPubkey}
        >
          <img src={mockImageSrc} alt="Test image" data-testid="test-image" />
        </SensitiveImage>
      );

      // ぼかしオーバーレイが表示されることを確認（安全側）
      expect(screen.getByText('非フォローユーザーの画像')).toBeInTheDocument();
    });
  });
});
