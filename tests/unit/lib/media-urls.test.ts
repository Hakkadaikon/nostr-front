import { describe, it, expect } from 'vitest';
import { parseMediaUrl, isImageUrl, isVideoUrl } from '../../../lib/utils/media-urls';

describe('media-urls', () => {
  describe('parseMediaUrl', () => {
    describe('X/Twitter URLs', () => {
      it('should parse x.com URLs', () => {
        const result = parseMediaUrl('https://x.com/user/status/1234567890');
        expect(result.platform).toBe('x');
        expect(result.mediaId).toBe('1234567890');
        expect(result.embedUrl).toBe('https://platform.twitter.com/embed/Tweet.html?id=1234567890');
        expect(result.originalUrl).toBe('https://x.com/user/status/1234567890');
      });

      it('should parse twitter.com URLs', () => {
        const result = parseMediaUrl('https://twitter.com/user/status/1234567890');
        expect(result.platform).toBe('twitter');
        expect(result.mediaId).toBe('1234567890');
        expect(result.embedUrl).toBe('https://platform.twitter.com/embed/Tweet.html?id=1234567890');
        expect(result.originalUrl).toBe('https://twitter.com/user/status/1234567890');
      });

      it('should parse x.com URLs with statuses (plural)', () => {
        const result = parseMediaUrl('https://x.com/user/statuses/1234567890');
        expect(result.platform).toBe('x');
        expect(result.mediaId).toBe('1234567890');
      });

      it('should parse twitter.com URLs with query parameters', () => {
        const result = parseMediaUrl('https://twitter.com/user/status/1234567890?s=20');
        expect(result.platform).toBe('twitter');
        expect(result.mediaId).toBe('1234567890');
      });

      it('should handle usernames with underscores', () => {
        const result = parseMediaUrl('https://x.com/test_user_123/status/9876543210');
        expect(result.platform).toBe('x');
        expect(result.mediaId).toBe('9876543210');
      });

      it('should handle mobile twitter URLs', () => {
        const result = parseMediaUrl('https://mobile.twitter.com/user/status/1234567890');
        expect(result.platform).toBe('twitter');
        expect(result.mediaId).toBe('1234567890');
      });
    });

    describe('YouTube URLs', () => {
      it('should parse standard youtube.com/watch URLs', () => {
        const result = parseMediaUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        expect(result.platform).toBe('youtube');
        expect(result.mediaId).toBe('dQw4w9WgXcQ');
        expect(result.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
      });

      it('should parse youtu.be short URLs', () => {
        const result = parseMediaUrl('https://youtu.be/dQw4w9WgXcQ');
        expect(result.platform).toBe('youtube');
        expect(result.mediaId).toBe('dQw4w9WgXcQ');
      });

      it('should parse youtube.com/shorts URLs', () => {
        const result = parseMediaUrl('https://www.youtube.com/shorts/abc123XYZ_-');
        expect(result.platform).toBe('youtube');
        expect(result.mediaId).toBe('abc123XYZ_-');
      });

      it('should parse youtube.com/embed URLs', () => {
        const result = parseMediaUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
        expect(result.platform).toBe('youtube');
        expect(result.mediaId).toBe('dQw4w9WgXcQ');
      });

      it('should handle youtube URLs with extra parameters', () => {
        const result = parseMediaUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s');
        expect(result.platform).toBe('youtube');
        expect(result.mediaId).toBe('dQw4w9WgXcQ');
      });

      it('should parse mobile youtube.com URLs (m.youtube.com)', () => {
        const result = parseMediaUrl('https://m.youtube.com/watch?v=dQw4w9WgXcQ');
        expect(result.platform).toBe('youtube');
        expect(result.mediaId).toBe('dQw4w9WgXcQ');
        expect(result.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
      });

      it('should parse mobile youtube shorts URLs', () => {
        const result = parseMediaUrl('https://m.youtube.com/shorts/abc123XYZ_-');
        expect(result.platform).toBe('youtube');
        expect(result.mediaId).toBe('abc123XYZ_-');
      });

      it('should handle mobile youtube URLs with query parameters', () => {
        const result = parseMediaUrl('https://m.youtube.com/watch?v=dQw4w9WgXcQ&feature=share');
        expect(result.platform).toBe('youtube');
        expect(result.mediaId).toBe('dQw4w9WgXcQ');
      });

      it('should handle youtube URLs with feature parameter', () => {
        const result = parseMediaUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share');
        expect(result.platform).toBe('youtube');
        expect(result.mediaId).toBe('dQw4w9WgXcQ');
      });
    });

    describe('Spotify URLs', () => {
      it('should parse Spotify track URLs', () => {
        const result = parseMediaUrl('https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp');
        expect(result.platform).toBe('spotify');
        expect(result.mediaId).toBe('3n3Ppam7vgaVa1iaRUc9Lp');
        expect(result.embedUrl).toBe('https://open.spotify.com/embed/track/3n3Ppam7vgaVa1iaRUc9Lp');
      });

      it('should parse Spotify album URLs', () => {
        const result = parseMediaUrl('https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3');
        expect(result.platform).toBe('spotify');
        expect(result.embedUrl).toBe('https://open.spotify.com/embed/album/1DFixLWuPkv3KT3TnV35m3');
      });

      it('should parse Spotify playlist URLs', () => {
        const result = parseMediaUrl('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M');
        expect(result.platform).toBe('spotify');
        expect(result.embedUrl).toContain('playlist');
      });
    });

    describe('Apple Podcasts URLs', () => {
      it('should parse Apple Podcasts URLs', () => {
        const result = parseMediaUrl('https://podcasts.apple.com/us/podcast/the-daily/id1200361736');
        expect(result.platform).toBe('apple-podcasts');
        expect(result.mediaId).toBe('1200361736');
        expect(result.embedUrl).toContain('embed/podcast');
      });
    });

    describe('Image URLs', () => {
      it('should detect PNG images', () => {
        const result = parseMediaUrl('https://example.com/image.png');
        expect(result.platform).toBe('image');
      });

      it('should detect JPEG images', () => {
        const result = parseMediaUrl('https://example.com/photo.jpg');
        expect(result.platform).toBe('image');
      });

      it('should detect WebP images', () => {
        const result = parseMediaUrl('https://example.com/image.webp');
        expect(result.platform).toBe('image');
      });

      it('should detect GIF images', () => {
        const result = parseMediaUrl('https://example.com/animation.gif');
        expect(result.platform).toBe('image');
      });
    });

    describe('Video URLs', () => {
      it('should detect MP4 videos', () => {
        const result = parseMediaUrl('https://example.com/video.mp4');
        expect(result.platform).toBe('video');
      });

      it('should detect WebM videos', () => {
        const result = parseMediaUrl('https://example.com/video.webm');
        expect(result.platform).toBe('video');
      });
    });

    describe('Unknown URLs', () => {
      it('should return unknown for unrecognized URLs', () => {
        const result = parseMediaUrl('https://example.com/page');
        expect(result.platform).toBe('unknown');
        expect(result.originalUrl).toBe('https://example.com/page');
      });
    });
  });

  describe('isImageUrl', () => {
    it('should return true for image extensions', () => {
      expect(isImageUrl('https://example.com/test.png')).toBe(true);
      expect(isImageUrl('https://example.com/test.jpg')).toBe(true);
      expect(isImageUrl('https://example.com/test.jpeg')).toBe(true);
      expect(isImageUrl('https://example.com/test.gif')).toBe(true);
      expect(isImageUrl('https://example.com/test.webp')).toBe(true);
    });

    it('should return true for uppercase image extensions', () => {
      expect(isImageUrl('https://example.com/test.PNG')).toBe(true);
      expect(isImageUrl('https://example.com/test.JPG')).toBe(true);
      expect(isImageUrl('https://example.com/test.JPEG')).toBe(true);
      expect(isImageUrl('https://example.com/test.GIF')).toBe(true);
    });

    it('should return true for image URLs with query parameters', () => {
      expect(isImageUrl('https://example.com/test.jpg?size=large')).toBe(true);
      expect(isImageUrl('https://example.com/test.png?width=800&height=600')).toBe(true);
      expect(isImageUrl('https://cdn.example.com/images/photo.jpeg?token=abc123')).toBe(true);
    });

    it('should return true for CDN image URLs', () => {
      expect(isImageUrl('https://cdn.example.com/image.jpg')).toBe(true);
      expect(isImageUrl('https://i.imgur.com/abc123.png')).toBe(true);
      expect(isImageUrl('https://media.example.com/path/to/image.webp')).toBe(true);
    });

    it('should return false for excluded hosts', () => {
      expect(isImageUrl('https://share.yabu.me/image.png')).toBe(false);
      expect(isImageUrl('https://imgur.com/gallery/abc123/image.jpg')).toBe(false);
      expect(isImageUrl('https://gyazo.com/abc123.png')).toBe(false);
    });

    it('should return true for imgur direct image URLs', () => {
      expect(isImageUrl('https://i.imgur.com/abc123.jpg')).toBe(true);
      expect(isImageUrl('https://imgur.com/abc123.png')).toBe(true);
    });

    it('should return false for non-image URLs', () => {
      expect(isImageUrl('https://example.com/page')).toBe(false);
      expect(isImageUrl('https://example.com/video.mp4')).toBe(false);
    });
  });

  describe('isVideoUrl', () => {
    it('should return true for video extensions', () => {
      expect(isVideoUrl('https://example.com/test.mp4')).toBe(true);
      expect(isVideoUrl('https://example.com/test.webm')).toBe(true);
      expect(isVideoUrl('https://example.com/test.mov')).toBe(true);
    });

    it('should return false for non-video URLs', () => {
      expect(isVideoUrl('https://example.com/image.png')).toBe(false);
      expect(isVideoUrl('https://example.com/page')).toBe(false);
    });
  });
});
