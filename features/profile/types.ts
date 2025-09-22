export interface Profile {
  npub: string;
  name?: string;
  displayName?: string;
  about?: string;
  picture?: string;
  banner?: string;
  website?: string;
  lud16?: string; // Lightning address
  nip05?: string; // Nostr address verification
}
