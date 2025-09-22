import { test, expect } from '@playwright/test';
import {
  setMobileViewport,
  setTabletViewport,
  setDesktopViewport,
  setViewport,
  ViewportPresets,
  createPost,
  isElementInViewport,
} from '../helpers/test-utils';

test.describe('Media Embed Responsiveness', () => {
  test.describe('YouTube Embeds', () => {
    test('should maintain aspect ratio across viewports', async ({ page }) => {
      await page.goto('/');
      
      // YouTube URLを含む投稿を作成
      const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      await createPost(page, `Check out this video: ${youtubeUrl}`);
      
      const viewports = ['mobile', 'tablet', 'desktop'] as const;
      
      for (const viewport of viewports) {
        await setViewport(page, viewport);
        
        const iframe = page.locator('iframe[src*="youtube.com"]').first();
        if (await iframe.isVisible()) {
          const box = await iframe.boundingBox();
          if (box) {
            // 16:9のアスペクト比を確認（許容誤差5%）
            const aspectRatio = box.width / box.height;
            expect(aspectRatio).toBeGreaterThan(1.7);
            expect(aspectRatio).toBeLessThan(1.85);
          }
        }
      }
    });

    test('should resize properly on mobile', async ({ page }) => {
      await setMobileViewport(page);
      await page.goto('/');
      
      const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      await createPost(page, `Mobile video test: ${youtubeUrl}`);
      
      const iframe = page.locator('iframe[src*="youtube.com"]').first();
      if (await iframe.isVisible()) {
        // モバイルで動画がビューポート内に収まることを確認
        const isInViewport = await isElementInViewport(page, 'iframe[src*="youtube.com"]');
        expect(isInViewport).toBeTruthy();
        
        // 動画の幅が画面幅を超えないことを確認
        const box = await iframe.boundingBox();
        const viewportSize = page.viewportSize();
        
        if (box && viewportSize) {
          expect(box.width).toBeLessThanOrEqual(viewportSize.width - 32); // パディングを考慮
        }
      }
    });
  });

  test.describe('Image Galleries', () => {
    test('should display single image correctly', async ({ page }) => {
      await page.goto('/');
      
      const imageUrl = 'https://example.com/test-image.jpg';
      await createPost(page, `Single image test: ${imageUrl}`);
      
      // 各ビューポートで画像の表示を確認
      const viewports = ['mobile', 'tablet', 'desktop'] as const;
      
      for (const viewport of viewports) {
        await setViewport(page, viewport);
        
        const img = page.locator(`img[src*="test-image.jpg"]`).first();
        if (await img.isVisible()) {
          const box = await img.boundingBox();
          const viewportSize = page.viewportSize();
          
          if (box && viewportSize) {
            // 画像が画面幅を超えないことを確認
            expect(box.width).toBeLessThanOrEqual(viewportSize.width);
            
            // モバイルでは画像が小さくなることを確認
            if (viewport === 'mobile') {
              expect(box.width).toBeLessThanOrEqual(viewportSize.width - 16);
            }
          }
        }
      }
    });

    test('should handle multiple images grid layout', async ({ page }) => {
      await page.goto('/');
      
      // 複数画像の投稿を作成
      const images = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
        'https://example.com/image4.jpg',
      ];
      
      await createPost(page, `Multiple images test: ${images.join(' ')}`);
      
      // モバイルでは2×2グリッド、デスクトップでは適切なグリッドレイアウト
      await setMobileViewport(page);
      const mobileImages = page.locator('img[src*="example.com/image"]');
      const mobileCount = await mobileImages.count();
      
      if (mobileCount > 0) {
        // 最初の画像のサイズを取得
        const firstImage = mobileImages.first();
        const box = await firstImage.boundingBox();
        const viewportSize = page.viewportSize();
        
        if (box && viewportSize) {
          // 画像が画面幅の約半分であることを確認（2列グリッド）
          expect(box.width).toBeGreaterThan(viewportSize.width * 0.4);
          expect(box.width).toBeLessThan(viewportSize.width * 0.6);
        }
      }
    });
  });

  test.describe('X (Twitter) Embeds', () => {
    test('should display tweet embeds responsively', async ({ page }) => {
      await page.goto('/');
      
      const tweetUrl = 'https://x.com/user/status/123456789';
      await createPost(page, `Check this tweet: ${tweetUrl}`);
      
      // 各ビューポートでツイート埋め込みの表示を確認
      const viewports = ['mobile', 'tablet', 'desktop'] as const;
      
      for (const viewport of viewports) {
        await setViewport(page, viewport);
        
        const tweetEmbed = page.locator('blockquote.twitter-tweet, [data-tweet-id]').first();
        if (await tweetEmbed.isVisible()) {
          const box = await tweetEmbed.boundingBox();
          const viewportSize = page.viewportSize();
          
          if (box && viewportSize) {
            // ツイート埋め込みが適切なサイズであることを確認
            if (viewport === 'mobile') {
              expect(box.width).toBeGreaterThanOrEqual(viewportSize.width * 0.9);
            } else {
              expect(box.width).toBeLessThanOrEqual(550); // Twitterの標準幅
            }
          }
        }
      }
    });
  });

  test.describe('Video Player', () => {
    test('should display native video controls responsively', async ({ page }) => {
      await page.goto('/');
      
      const videoUrl = 'https://example.com/video.mp4';
      await createPost(page, `Video test: ${videoUrl}`);
      
      // 各ビューポートで動画プレイヤーの表示を確認
      const viewports = ['mobile', 'tablet', 'desktop'] as const;
      
      for (const viewport of viewports) {
        await setViewport(page, viewport);
        
        const video = page.locator('video').first();
        if (await video.isVisible()) {
          // 動画にコントロールがあることを確認
          await expect(video).toHaveAttribute('controls', '');
          
          const box = await video.boundingBox();
          const viewportSize = page.viewportSize();
          
          if (box && viewportSize) {
            // 動画が画面幅を超えないことを確認
            expect(box.width).toBeLessThanOrEqual(viewportSize.width);
            
            // モバイルでは全幅表示
            if (viewport === 'mobile') {
              expect(box.width).toBeGreaterThanOrEqual(viewportSize.width * 0.95);
            }
          }
        }
      }
    });
  });

  test.describe('Link Previews', () => {
    test('should display link previews responsively', async ({ page }) => {
      await page.goto('/');
      
      const articleUrl = 'https://example.com/article';
      await createPost(page, `Interesting article: ${articleUrl}`);
      
      // リンクプレビューが生成されるまで待機
      await page.waitForTimeout(1000);
      
      // 各ビューポートでリンクプレビューの表示を確認
      const viewports = ['mobile', 'tablet', 'desktop'] as const;
      
      for (const viewport of viewports) {
        await setViewport(page, viewport);
        
        const linkPreview = page.locator('[data-testid="link-preview"], .link-preview').first();
        if (await linkPreview.isVisible()) {
          const box = await linkPreview.boundingBox();
          const viewportSize = page.viewportSize();
          
          if (box && viewportSize) {
            // リンクプレビューが適切なサイズであることを確認
            expect(box.width).toBeLessThanOrEqual(viewportSize.width);
            
            // モバイルでは縦レイアウト、デスクトップでは横レイアウト
            if (viewport === 'mobile') {
              expect(box.width).toBeGreaterThanOrEqual(viewportSize.width * 0.9);
            }
          }
        }
      }
    });

    test('should truncate long titles on mobile', async ({ page }) => {
      await setMobileViewport(page);
      await page.goto('/');
      
      const longTitleUrl = 'https://example.com/very-long-article-title-that-should-be-truncated';
      await createPost(page, `Long title test: ${longTitleUrl}`);
      
      // リンクプレビューが生成されるまで待機
      await page.waitForTimeout(1000);
      
      const linkPreviewTitle = page.locator('[data-testid="link-preview-title"], .link-preview-title').first();
      if (await linkPreviewTitle.isVisible()) {
        // タイトルに省略記号またはtext-overflowスタイルがあることを確認
        const hasEllipsis = await linkPreviewTitle.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.textOverflow === 'ellipsis' || 
                 style.overflow === 'hidden' ||
                 el.textContent?.includes('...');
        });
        
        expect(hasEllipsis).toBeTruthy();
      }
    });
  });
});