import { create } from 'zustand';

export const useUiStore = create<{
  theme: 'light' | 'dark';
  toast?: string;
  isComposeModalOpen: boolean;
  setTheme: (t: 'light' | 'dark') => void;
  showToast: (m: string) => void;
  clearToast: () => void;
  openComposeModal: () => void;
  closeComposeModal: () => void;
}>(set => ({
  theme: 'dark',
  toast: undefined,
  isComposeModalOpen: false,
  setTheme: (t) => set({ theme: t }),
  showToast: (m) => set({ toast: m }),
  clearToast: () => set({ toast: undefined }),
  openComposeModal: () => set({ isComposeModalOpen: true }),
  closeComposeModal: () => set({ isComposeModalOpen: false }),
}));
