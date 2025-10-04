import { create } from 'zustand';
import { Profile } from '../features/profile/types';

type State = {
  current?: Profile;
  viewing?: Profile;
  // プロフィール画像の更新を追跡するためのマップ (pubkey -> picture URL)
  profilePictures: Map<string, string>;
  setCurrent: (p?: Profile) => void;
  setViewing: (p?: Profile) => void;
  updateProfilePicture: (pubkey: string, picture: string) => void;
  getProfilePicture: (pubkey: string) => string | undefined;
};

export const useProfileStore = create<State>((set, get) => ({
  current: undefined,
  viewing: undefined,
  profilePictures: new Map(),
  setCurrent: (p) => set({ current: p }),
  setViewing: (p) => set({ viewing: p }),
  updateProfilePicture: (pubkey: string, picture: string) => {
    set((state) => {
      const newMap = new Map(state.profilePictures);
      newMap.set(pubkey, picture);
      return { profilePictures: newMap };
    });
  },
  getProfilePicture: (pubkey: string) => {
    return get().profilePictures.get(pubkey);
  },
}));
