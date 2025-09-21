import { create } from 'zustand';

type Profile = { npub: string; name?: string; about?: string; picture?: string };

type State = {
  current?: Profile;
  viewing?: Profile;
  setCurrent: (p?: Profile) => void;
  setViewing: (p?: Profile) => void;
};

export const useProfileStore = create<State>((set) => ({
  current: undefined,
  viewing: undefined,
  setCurrent: (p) => set({ current: p }),
  setViewing: (p) => set({ viewing: p }),
}));
