// Media URL detection and parsing utilities

export type MediaPlatform = 'youtube' | 'x' | 'twitter' | 'spotify' | 'apple-podcasts' | 'image' | 'unknown';

export interface MediaInfo {
  platform: MediaPlatform;
  embedUrl?: string;
  mediaId?: string;
  originalUrl: string;
}

// YouTube URL patterns
const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i,
  /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/i,
  /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/i,
];

// X/Twitter URL patterns  
const X_PATTERNS = [
  /(?:twitter\.com|x\.com)\/(?:#!\/)?([A-Za-z0-9_]+)\/status(?:es)?\/(\d+)/i,
  /(?:twitter\.com|x\.com)\/([A-Za-z0-9_]+)\/status\/(\d+)/i,
];

// Spotify URL patterns
const SPOTIFY_PATTERNS = [
  /spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/i,
];

// Apple Podcasts URL patterns
const APPLE_PODCASTS_PATTERNS = [
  /podcasts\.apple\.com\/[^\/]+\/podcast\/[^\/]+\/id(\d+)/i,
];

// Image extensions
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|avif|svg)$/i;

/**
 * Extract YouTube video ID from URL
 */
function getYouTubeId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Extract X/Twitter status ID from URL
 */
function getXStatusId(url: string): { username: string; statusId: string } | null {
  for (const pattern of X_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1] && match[2]) {
      return { username: match[1], statusId: match[2] };
    }
  }
  return null;
}

/**
 * Extract Spotify content info from URL
 */
function getSpotifyInfo(url: string): { type: string; id: string } | null {
  for (const pattern of SPOTIFY_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1] && match[2]) {
      return { type: match[1], id: match[2] };
    }
  }
  return null;
}

/**
 * Check if URL is an image
 */
export function isImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return IMAGE_EXTENSIONS.test(parsed.pathname);
  } catch {
    return false;
  }
}

/**
 * Parse media URL and return platform-specific info
 */
export function parseMediaUrl(url: string): MediaInfo {
  // Check for YouTube
  const youtubeId = getYouTubeId(url);
  if (youtubeId) {
    return {
      platform: 'youtube',
      mediaId: youtubeId,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
      originalUrl: url,
    };
  }

  // Check for X/Twitter
  const xInfo = getXStatusId(url);
  if (xInfo) {
    return {
      platform: url.includes('twitter.com') ? 'twitter' : 'x',
      mediaId: xInfo.statusId,
      // X embed requires using Twitter's widget
      embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${xInfo.statusId}`,
      originalUrl: url,
    };
  }

  // Check for Spotify
  const spotifyInfo = getSpotifyInfo(url);
  if (spotifyInfo) {
    return {
      platform: 'spotify',
      mediaId: spotifyInfo.id,
      embedUrl: `https://open.spotify.com/embed/${spotifyInfo.type}/${spotifyInfo.id}`,
      originalUrl: url,
    };
  }

  // Check for Apple Podcasts
  for (const pattern of APPLE_PODCASTS_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return {
        platform: 'apple-podcasts',
        mediaId: match[1],
        embedUrl: url.replace('/podcast/', '/embed/podcast/'),
        originalUrl: url,
      };
    }
  }

  // Check for images
  if (isImageUrl(url)) {
    return {
      platform: 'image',
      originalUrl: url,
    };
  }

  return {
    platform: 'unknown',
    originalUrl: url,
  };
}