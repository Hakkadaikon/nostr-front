import { create } from 'zustand';
import { Profile } from '../features/profile/types';

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
