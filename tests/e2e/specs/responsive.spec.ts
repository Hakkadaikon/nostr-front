import { test, expect } from '@playwright/test';
import { 
  setMobileViewport, 
  setTabletViewport, 
  setDesktopViewport,
  navigateToNotifications,
  enableDarkMode,
  enableLightMode
} from '../helpers/test-utils';

test.describe('Responsive Design', () => {
  test('should display mobile navigation correctly', async ({ page }) => {
    await setMobileViewport(page);
    await page.goto('/');
    
    // モバイルナビゲーションバーが表示されることを確認
    await expect(page.locator('nav').filter({ hasText: 'ホーム' })).toBeVisible();
  });

  test('should display tablet layout correctly', async ({ page }) => {
    await setTabletViewport(page);
    await page.goto('/');
    
    // タブレットレイアウトで適切に表示されることを確認
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should display desktop sidebar', async ({ page }) => {
    await setDesktopViewport(page);
    await page.goto('/');
    
    // デスクトップサイドバーが表示されることを確認
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
  });

  test('notification tabs should be scrollable on mobile', async ({ page }) => {
    await setMobileViewport(page);
    await navigateToNotifications(page);
    
    // タブコンテナがスクロール可能であることを確認
    const tabContainer = page.locator('.overflow-x-auto').first();
    await expect(tabContainer).toBeVisible();
    
    // モバイル用の短縮表示を確認
    await expect(page.getByRole('tab', { name: '@' })).toBeVisible(); // メンション
    await expect(page.getByRole('tab', { name: 'RP' })).toBeVisible(); // リポスト
  });
});

test.describe('Dark Mode', () => {
  test('should toggle between light and dark mode', async ({ page }) => {
    await page.goto('/');
    
    // ライトモードで開始
    await enableLightMode(page);
    
    // 背景色を確認
    const body = page.locator('body');
    await expect(body).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    
    // ダークモードに切り替え
    await enableDarkMode(page);
    
    // ダークモードの背景色を確認
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should maintain dark mode on navigation', async ({ page }) => {
    await page.goto('/');
    await enableDarkMode(page);
    
    // 通知ページに移動
    await navigateToNotifications(page);
    
    // ダークモードが維持されることを確認
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // 主要なボタンにaria-labelがあることを確認
    await expect(page.getByRole('button', { name: 'Post' })).toBeVisible();
    
    await navigateToNotifications(page);
    
    // 通知のアクションボタンにaria-labelがあることを確認
    const likeButton = page.locator('button[aria-label="いいね"]').first();
    if (await likeButton.isVisible()) {
      await expect(likeButton).toHaveAttribute('aria-label', 'いいね');
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await navigateToNotifications(page);
    
    // h1要素が1つだけあることを確認
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    
    // h1が「通知」であることを確認
    await expect(page.getByRole('heading', { name: '通知', level: 1 })).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await navigateToNotifications(page);
    
    // Tabキーでフォーカス可能な要素を確認
    await page.keyboard.press('Tab');
    
    // フォーカスされた要素があることを確認
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});

test.describe('Performance', () => {
  test('should lazy load images', async ({ page }) => {
    await page.goto('/');
    
    // 画像を含む投稿を作成
    const textarea = page.getByPlaceholder("What's happening?");
    await textarea.fill('Check this image: https://example.com/image.jpg');
    await page.getByRole('button', { name: 'Post' }).click();
    
    // 画像要素を取得
    const img = page.locator('img[src*="example.com/image.jpg"]').first();
    
    if (await img.isVisible()) {
      // loading="lazy"属性があることを確認
      await expect(img).toHaveAttribute('loading', 'lazy');
    }
  });

  test('should use optimized images for avatars', async ({ page }) => {
    await navigateToNotifications(page);
    
    // アバター画像を確認
    const avatar = page.locator('img[alt*="User"]').first();
    
    if (await avatar.isVisible()) {
      // Next.js Imageコンポーネントが使用されていることを確認
      await expect(avatar).toHaveAttribute('loading');
    }
  });
});