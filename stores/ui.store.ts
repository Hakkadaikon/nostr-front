import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface UiState {
  theme: Theme;
  toast?: string;
  isComposeModalOpen: boolean;
  setTheme: (t: Theme) => void;
  showToast: (m: string) => void;
  clearToast: () => void;
  openComposeModal: () => void;
  closeComposeModal: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'system' as Theme,
      toast: undefined,
      isComposeModalOpen: false,
      setTheme: (t) => set({ theme: t }),
      showToast: (m) => set({ toast: m }),
      clearToast: () => set({ toast: undefined }),
      openComposeModal: () => set({ isComposeModalOpen: true }),
      closeComposeModal: () => set({ isComposeModalOpen: false }),
    }),
    {
      name: 'ui-preferences',
      partialize: (state) => ({ theme: state.theme }), // localStorageにはthemeのみ保存
    }
  )
);
