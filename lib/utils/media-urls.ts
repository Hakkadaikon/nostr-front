// Media URL detection and parsing utilities

export type MediaPlatform = 'youtube' | 'x' | 'twitter' | 'spotify' | 'apple-podcasts' | 'soundcloud' | 'vimeo' | 'tiktok' | 'twitch' | 'image' | 'video' | 'audio' | 'unknown';

export interface MediaInfo {
  platform: MediaPlatform;
  embedUrl?: string;
  mediaId?: string;
  originalUrl: string;
}

// YouTube URL patterns
const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i,
  /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/i,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i,
  /m\.youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i,
  /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/i,
  /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/i,
  /m\.youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/i,
];

// X/Twitter URL patterns
const X_PATTERNS = [
  /(?:twitter\.com|x\.com|mobile\.twitter\.com)\/(?:#!\/)?([A-Za-z0-9_]+)\/status(?:es)?\/(\d+)/i,
  /(?:twitter\.com|x\.com|mobile\.twitter\.com)\/([A-Za-z0-9_]+)\/status\/(\d+)/i,
];

// Spotify URL patterns
const SPOTIFY_PATTERNS = [
  /spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/i,
];

// Apple Podcasts URL patterns
const APPLE_PODCASTS_PATTERNS = [
  /podcasts\.apple\.com\/[^\/]+\/podcast\/[^\/]+\/id(\d+)/i,
];

// SoundCloud URL patterns
const SOUNDCLOUD_PATTERNS = [
  /soundcloud\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/i,
];

// Vimeo URL patterns
const VIMEO_PATTERNS = [
  /vimeo\.com\/(\d+)/i,
  /player\.vimeo\.com\/video\/(\d+)/i,
];

// TikTok URL patterns
const TIKTOK_PATTERNS = [
  /(?:www\.)?tiktok\.com\/@([^\/]+)\/video\/(\d+)/i,
  /vm\.tiktok\.com\/([a-zA-Z0-9]+)/i,
  /vt\.tiktok\.com\/([a-zA-Z0-9]+)/i,
  /m\.tiktok\.com\/@([^\/]+)\/video\/(\d+)/i,
  /m\.tiktok\.com\/v\/(\d+)/i,
];

// Twitch URL patterns
const TWITCH_PATTERNS = [
  /twitch\.tv\/videos\/(\d+)/i,
  /twitch\.tv\/([a-zA-Z0-9_]+)\/clip\/([a-zA-Z0-9_-]+)/i,
  /clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/i,
];

// Image extensions
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|avif|svg)$/i;

// Video extensions
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v|ogv)$/i;

// Audio extensions
const AUDIO_EXTENSIONS = /\.(mp3|m4a|wav|ogg|aac|flac|opus|weba)$/i;

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
 * Extract SoundCloud info from URL
 */
function getSoundCloudInfo(url: string): { user: string; track: string } | null {
  for (const pattern of SOUNDCLOUD_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1] && match[2]) {
      return { user: match[1], track: match[2] };
    }
  }
  return null;
}

/**
 * Extract Vimeo video ID from URL
 */
function getVimeoId(url: string): string | null {
  for (const pattern of VIMEO_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Extract TikTok info from URL
 */
function getTikTokInfo(url: string): { username?: string; videoId?: string; shortCode?: string } | null {
  // Full URL with username and video ID (www.tiktok.com, tiktok.com, m.tiktok.com)
  for (let i = 0; i < 2; i++) { // Check first 2 patterns for full URLs
    const match = url.match(TIKTOK_PATTERNS[i]);
    if (match && match[1] && match[2]) {
      return { username: match[1], videoId: match[2] };
    }
  }

  // Mobile URL with video ID only (m.tiktok.com/v/...)
  const mobileMatch = url.match(TIKTOK_PATTERNS[4]);
  if (mobileMatch && mobileMatch[1]) {
    return { videoId: mobileMatch[1] };
  }

  // Short URL (vm.tiktok.com, vt.tiktok.com)
  for (let i = 1; i < 4; i++) {
    const match = url.match(TIKTOK_PATTERNS[i]);
    if (match && match[1]) {
      // For patterns 1-2, it's a short code
      if (i < 3) {
        return { shortCode: match[1] };
      }
    }
  }

  return null;
}

/**
 * Extract Twitch info from URL
 */
function getTwitchInfo(url: string): { type: 'video' | 'clip'; videoId?: string; clipId?: string; channel?: string } | null {
  // Video
  const videoMatch = url.match(TWITCH_PATTERNS[0]);
  if (videoMatch && videoMatch[1]) {
    return { type: 'video', videoId: videoMatch[1] };
  }

  // Channel clip
  const channelClipMatch = url.match(TWITCH_PATTERNS[1]);
  if (channelClipMatch && channelClipMatch[1] && channelClipMatch[2]) {
    return { type: 'clip', channel: channelClipMatch[1], clipId: channelClipMatch[2] };
  }

  // Direct clip
  const clipMatch = url.match(TWITCH_PATTERNS[2]);
  if (clipMatch && clipMatch[1]) {
    return { type: 'clip', clipId: clipMatch[1] };
  }

  return null;
}

/**
 * Check if URL is an image
 */
export function isImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // 特定の画像共有サービスは除外（ギャラリーページなど）
    // imgur.com/gallery のようなギャラリーは除外するが、i.imgur.com の直接画像は許可
    if (parsed.hostname === 'share.yabu.me') {
      return false;
    }

    if (parsed.hostname === 'gyazo.com') {
      return false;
    }

    // imgur.com/gallery/* はギャラリーページなので除外
    if (parsed.hostname === 'imgur.com' && parsed.pathname.startsWith('/gallery')) {
      return false;
    }

    // 直接的な画像URLかチェック（pathnameのみで判定するためクエリパラメータは影響しない）
    return IMAGE_EXTENSIONS.test(parsed.pathname);
  } catch {
    return false;
  }
}

/**
 * Check if URL is a video
 */
export function isVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return VIDEO_EXTENSIONS.test(parsed.pathname);
  } catch {
    return false;
  }
}

/**
 * Check if URL is an audio file
 */
export function isAudioUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return AUDIO_EXTENSIONS.test(parsed.pathname);
  } catch {
    return false;
  }
}

/**
 * Extract all image URLs from text content
 */
export function extractImageUrls(content: string): string[] {
  const imageUrls: string[] = [];
  const urlRegex = /https?:\/\/[^\s]+/gi;
  const matches = content.matchAll(urlRegex);

  for (const match of matches) {
    const url = match[0].replace(/[)\]\}>,.;]+$/g, ''); // Remove trailing punctuation
    if (isImageUrl(url)) {
      imageUrls.push(url);
    }
  }

  return imageUrls;
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

  // Check for SoundCloud
  const soundcloudInfo = getSoundCloudInfo(url);
  if (soundcloudInfo) {
    return {
      platform: 'soundcloud',
      embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`,
      originalUrl: url,
    };
  }

  // Check for Vimeo
  const vimeoId = getVimeoId(url);
  if (vimeoId) {
    return {
      platform: 'vimeo',
      mediaId: vimeoId,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      originalUrl: url,
    };
  }

  // Check for TikTok
  const tiktokInfo = getTikTokInfo(url);
  if (tiktokInfo) {
    return {
      platform: 'tiktok',
      mediaId: tiktokInfo.videoId || tiktokInfo.shortCode,
      embedUrl: url, // TikTokの埋め込みは元のURLを使用
      originalUrl: url,
    };
  }

  // Check for Twitch
  const twitchInfo = getTwitchInfo(url);
  if (twitchInfo) {
    let embedUrl = '';
    if (twitchInfo.type === 'video' && twitchInfo.videoId) {
      embedUrl = `https://player.twitch.tv/?video=${twitchInfo.videoId}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}`;
    } else if (twitchInfo.type === 'clip' && twitchInfo.clipId) {
      embedUrl = `https://clips.twitch.tv/embed?clip=${twitchInfo.clipId}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}`;
    }
    return {
      platform: 'twitch',
      mediaId: twitchInfo.videoId || twitchInfo.clipId,
      embedUrl,
      originalUrl: url,
    };
  }

  // Check for images
  if (isImageUrl(url)) {
    return {
      platform: 'image',
      originalUrl: url,
    };
  }

  // Check for videos
  if (isVideoUrl(url)) {
    return {
      platform: 'video',
      originalUrl: url,
    };
  }

  // Check for audio
  if (isAudioUrl(url)) {
    return {
      platform: 'audio',
      originalUrl: url,
    };
  }

  return {
    platform: 'unknown',
    originalUrl: url,
  };
}