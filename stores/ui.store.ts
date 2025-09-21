import { create } from 'zustand';

export const useUiStore = create<{
  theme: 'light' | 'dark';
  toast?: string;
  setTheme: (t: 'light' | 'dark') => void;
  showToast: (m: string) => void;
  clearToast: () => void;
}>(set => ({
  theme: 'dark',
  toast: undefined,
  setTheme: (t) => set({ theme: t }),
  showToast: (m) => set({ toast: m }),
  clearToast: () => set({ toast: undefined }),
}));
