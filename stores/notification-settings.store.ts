import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NotificationSettings, defaultNotificationSettings } from '../types/notification-settings';

interface NotificationSettingsStore {
  settings: NotificationSettings;
  updateSetting: (key: keyof NotificationSettings, value: boolean) => void;
  updateAllSettings: (settings: NotificationSettings) => void;
}

export const useNotificationSettingsStore = create<NotificationSettingsStore>()(
  persist(
    (set) => ({
      settings: defaultNotificationSettings,
      
      updateSetting: (key, value) => set((state) => ({
        settings: {
          ...state.settings,
          [key]: value,
        },
      })),
      
      updateAllSettings: (settings) => set(() => ({
        settings,
      })),
    }),
    {
      name: 'notification-settings-storage',
    }
  )
);