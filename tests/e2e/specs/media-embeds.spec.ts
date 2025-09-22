import { test, expect } from '@playwright/test';
import { mockMediaUrls } from '../fixtures/notification-fixtures';

test.describe('Media Embeds', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用のページを作成（実際のアプリケーションではRichContentコンポーネントが使用される場所）
    await page.goto('/');
  });

  test.describe('YouTube Embeds', () => {
    test('should display YouTube video thumbnail before playing', async ({ page }) => {
      // YouTube URLを含む投稿を作成
      const textarea = page.getByPlaceholder("いまどうしてる？");
      await textarea.fill(`Check out this video: ${mockMediaUrls.youtube}`);
      await page.getByRole('button', { name: 'ポストする' }).click();
      
      // サムネイルが表示されることを確認
      await expect(page.locator('img[src*="img.youtube.com"]').first()).toBeVisible();
      
      // プレイボタンが表示されることを確認
      await expect(page.locator('.bg-red-600').first()).toBeVisible();
    });

    test('should embed YouTube video on thumbnail click', async ({ page }) => {
      // YouTube URLを含む投稿を作成
      const textarea = page.getByPlaceholder("いまどうしてる？");
      await textarea.fill(`Check out this video: ${mockMediaUrls.youtube}`);
      await page.getByRole('button', { name: 'ポストする' }).click();
      
      // サムネイルをクリック
      await page.locator('.group.cursor-pointer').first().click();
      
      // iframeが表示されることを確認
      await expect(page.locator('iframe[src*="youtube.com/embed"]').first()).toBeVisible();
    });

    test('should handle YouTube short URLs', async ({ page }) => {
      // YouTube短縮URLを含む投稿を作成
      const textarea = page.getByPlaceholder("いまどうしてる？");
      await textarea.fill(`Short URL: ${mockMediaUrls.youtubeShort}`);
      await page.getByRole('button', { name: 'ポストする' }).click();
      
      // サムネイルが表示されることを確認
      await expect(page.locator('img[src*="img.youtube.com"]').first()).toBeVisible();
    });
  });

  test.describe('X/Twitter Embeds', () => {
    test('should embed X posts', async ({ page }) => {
      // X URLを含む投稿を作成
      const textarea = page.getByPlaceholder("いまどうしてる？");
      await textarea.fill(`Check this tweet: ${mockMediaUrls.x}`);
      await page.getByRole('button', { name: 'ポストする' }).click();
      
      // Twitter埋め込みコンテナが表示されることを確認
      await expect(page.locator('.twitter-embed').first()).toBeVisible();
    });

    test('should handle legacy twitter.com URLs', async ({ page }) => {
      // Twitter URLを含む投稿を作成
      const textarea = page.getByPlaceholder("いまどうしてる？");
      await textarea.fill(`Old tweet: ${mockMediaUrls.twitter}`);
      await page.getByRole('button', { name: 'ポストする' }).click();
      
      // Twitter埋め込みコンテナが表示されることを確認
      await expect(page.locator('.twitter-embed').first()).toBeVisible();
    });
  });

  test.describe('Spotify Embeds', () => {
    test('should embed Spotify tracks', async ({ page }) => {
      // Spotify トラックURLを含む投稿を作成
      const textarea = page.getByPlaceholder("いまどうしてる？");
      await textarea.fill(`Listen to this: ${mockMediaUrls.spotify}`);
      await page.getByRole('button', { name: 'ポストする' }).click();
      
      // Spotify iframeが表示されることを確認
      await expect(page.locator('iframe[src*="spotify.com/embed"]').first()).toBeVisible();
      
      // "Listen on Spotify"リンクが表示されることを確認
      await expect(page.locator('text=Listen on Spotify →').first()).toBeVisible();
    });

    test('should embed Spotify albums with correct height', async ({ page }) => {
      // Spotify アルバムURLを含む投稿を作成
      const textarea = page.getByPlaceholder("いまどうしてる？");
      await textarea.fill(`New album: ${mockMediaUrls.spotifyAlbum}`);
      await page.getByRole('button', { name: 'ポストする' }).click();
      
      // Spotify iframeが表示されることを確認
      const iframe = page.locator('iframe[src*="spotify.com/embed"]').first();
      await expect(iframe).toBeVisible();
      
      // アルバムの場合は高さが380pxであることを確認
      await expect(iframe).toHaveAttribute('height', '380');
    });
  });

  test.describe('Apple Podcasts Embeds', () => {
    test('should embed Apple Podcasts', async ({ page }) => {
      // Apple Podcasts URLを含む投稿を作成
      const textarea = page.getByPlaceholder("いまどうしてる？");
      await textarea.fill(`Great podcast: ${mockMediaUrls.applePodcast}`);
      await page.getByRole('button', { name: 'ポストする' }).click();
      
      // Apple Podcasts iframeが表示されることを確認
      await expect(page.locator('iframe[src*="apple.com/embed"]').first()).toBeVisible();
      
      // "Listen on Apple Podcasts"リンクが表示されることを確認
      await expect(page.locator('text=Listen on Apple Podcasts →').first()).toBeVisible();
    });
  });

  test.describe('Image Embeds', () => {
    test('should embed images directly', async ({ page }) => {
      // 画像URLを含む投稿を作成
      const textarea = page.getByPlaceholder("いまどうしてる？");
      await textarea.fill(`Look at this: ${mockMediaUrls.image}`);
      await page.getByRole('button', { name: 'ポストする' }).click();
      
      // 画像が表示されることを確認
      await expect(page.locator(`img[src="${mockMediaUrls.image}"]`).first()).toBeVisible();
    });

    test('should embed GIFs', async ({ page }) => {
      // GIF URLを含む投稿を作成
      const textarea = page.getByPlaceholder("いまどうしてる？");
      await textarea.fill(`Funny GIF: ${mockMediaUrls.gif}`);
      await page.getByRole('button', { name: 'ポストする' }).click();
      
      // GIFが表示されることを確認
      await expect(page.locator(`img[src="${mockMediaUrls.gif}"]`).first()).toBeVisible();
    });
  });

  test.describe('Multiple Media Embeds', () => {
    test('should handle multiple media URLs in single post', async ({ page }) => {
      // 複数のメディアURLを含む投稿を作成
      const textarea = page.getByPlaceholder("いまどうしてる？");
      await textarea.fill(`
        Check these out:
        ${mockMediaUrls.youtube}
        ${mockMediaUrls.image}
        ${mockMediaUrls.spotify}
      `);
      await page.getByRole('button', { name: 'ポストする' }).click();
      
      // すべてのメディアが埋め込まれることを確認
      await expect(page.locator('img[src*="youtube.com"]').first()).toBeVisible();
      await expect(page.locator(`img[src="${mockMediaUrls.image}"]`).first()).toBeVisible();
      await expect(page.locator('iframe[src*="spotify.com"]').first()).toBeVisible();
    });
  });

  test.describe('Media Embed Security', () => {
    test('should have proper sandbox attributes on iframes', async ({ page }) => {
      // YouTube URLを含む投稿を作成
      const textarea = page.getByPlaceholder("いまどうしてる？");
      await textarea.fill(`Video: ${mockMediaUrls.youtube}`);
      await page.getByRole('button', { name: 'ポストする' }).click();
      
      // サムネイルをクリックして埋め込みを表示
      await page.locator('.group.cursor-pointer').first().click();
      
      // iframeにsandbox属性があることを確認
      const iframe = page.locator('iframe[src*="youtube.com/embed"]').first();
      await expect(iframe).toHaveAttribute('sandbox');
    });

    test('should have lazy loading on media elements', async ({ page }) => {
      // 画像URLを含む投稿を作成
      const textarea = page.getByPlaceholder("いまどうしてる？");
      await textarea.fill(`Image: ${mockMediaUrls.image}`);
      await page.getByRole('button', { name: 'ポストする' }).click();
      
      // 画像にloading="lazy"属性があることを確認
      const img = page.locator(`img[src="${mockMediaUrls.image}"]`).first();
      await expect(img).toHaveAttribute('loading', 'lazy');
    });
  });
});

test.describe('Link Previews', () => {
  test('should show link preview for non-media URLs', async ({ page }) => {
    await page.goto('/');
    
    // 非メディアURLを含む投稿を作成
    const textarea = page.getByPlaceholder("What's happening?");
    await textarea.fill('Check out https://example.com');
    await page.getByRole('button', { name: 'Post' }).click();
    
    // リンクプレビューが表示されることを確認（LinkPreviewコンポーネント）
    await expect(page.locator('a[href="https://example.com"]').first()).toBeVisible();
  });
});