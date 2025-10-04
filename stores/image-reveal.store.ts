import { create } from 'zustand';

/**
 * 非フォロワーの画像解除状態を管理するストア
 * セッション内で解除状態を保持（画像URL単位）
 */

type State = {
  // 解除された画像URLのSet（セッション内で保持）
  revealedImages: Set<string>;
};

type Actions = {
  /**
   * 指定された画像URLを解除状態にする
   */
  revealImage: (imageUrl: string) => void;

  /**
   * 指定された画像URLが解除されているかを確認
   */
  isRevealed: (imageUrl: string) => boolean;

  /**
   * 全ての解除状態をクリア
   */
  clearAll: () => void;
};

export const useImageRevealStore = create<State & Actions>((set, get) => ({
  revealedImages: new Set<string>(),

  revealImage: (imageUrl) => {
    const newSet = new Set(get().revealedImages);
    newSet.add(imageUrl);
    set({ revealedImages: newSet });
  },

  isRevealed: (imageUrl) => {
    return get().revealedImages.has(imageUrl);
  },

  clearAll: () => {
    set({ revealedImages: new Set<string>() });
  },
}));
