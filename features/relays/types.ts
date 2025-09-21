export type Relay = { url: string; read: boolean; write: boolean };
export type RelayConfig = {
  relays: Relay[];
  add: (url: string) => void;
  remove: (url: string) => void;
  toggleRead: (url: string) => void;
  toggleWrite: (url: string) => void;
};
