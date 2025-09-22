export interface NotificationSettings {
  follow: boolean;
  mention: boolean;
  repost: boolean;
  zap: boolean;
  like: boolean;
  reply: boolean;
}

export const defaultNotificationSettings: NotificationSettings = {
  follow: true,
  mention: true,
  repost: true,
  zap: true,
  like: false,
  reply: false,
};