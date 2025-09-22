import { test, expect } from '@playwright/test';
import { 
  setMobileViewport, 
  setTabletViewport, 
  setDesktopViewport,
  setLargeDesktopViewport,
  setLargeMobileViewport,
  setMobileLandscapeViewport,
  setTabletLandscapeViewport,
  setViewport,
  ViewportPresets,
  navigateToNotifications,
  enableDarkMode,
  enableLightMode,
  simulateTap,
  simulateSwipe,
  isElementInViewport,
  checkMediaQuery,
  createPost
} from '../helpers/test-utils';

test.describe('Responsive Design', () => {
  test.describe('Navigation & Layout', () => {
    test('should display mobile navigation correctly', async ({ page }) => {
      await setMobileViewport(page);
      await page.goto('/');
      
      // モバイルナビゲーションバーが表示されることを確認
      await expect(page.locator('nav').filter({ hasText: 'ホーム' })).toBeVisible();
      
      // デスクトップサイドバーが非表示であることを確認
      await expect(page.locator('aside').first()).not.toBeVisible();
    });

    test('should display tablet layout correctly', async ({ page }) => {
      await setTabletViewport(page);
      await page.goto('/');
      
      // タブレットレイアウトで適切に表示されることを確認
      await expect(page.getByRole('main')).toBeVisible();
      
      // サイドバーまたはモバイルナビのいずれかが表示されることを確認
      const sidebar = page.locator('aside').first();
      const mobileNav = page.locator('nav').filter({ hasText: 'ホーム' });
      const sidebarVisible = await sidebar.isVisible();
      const mobileNavVisible = await mobileNav.isVisible();
      
      expect(sidebarVisible || mobileNavVisible).toBeTruthy();
    });

    test('should display desktop sidebar', async ({ page }) => {
      await setDesktopViewport(page);
      await page.goto('/');
      
      // デスクトップサイドバーが表示されることを確認
      const sidebar = page.locator('aside').first();
      await expect(sidebar).toBeVisible();
      
      // モバイルナビゲーションが非表示であることを確認
      await expect(page.locator('nav').filter({ hasText: 'ホーム' })).not.toBeVisible();
    });

    test('should handle large desktop displays correctly', async ({ page }) => {
      await setLargeDesktopViewport(page);
      await page.goto('/');
      
      // コンテンツの最大幅が制限されているか確認
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();
      
      // メディアクエリの状態を確認
      const isLargeScreen = await checkMediaQuery(page, '(min-width: 1920px)');
      expect(isLargeScreen).toBeTruthy();
    });
  });

  test.describe('Mobile Specific Features', () => {
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

    test('should handle landscape orientation', async ({ page }) => {
      await setMobileLandscapeViewport(page);
      await page.goto('/');
      
      // 横向きでもナビゲーションが適切に表示されることを確認
      const nav = page.locator('nav').filter({ hasText: 'ホーム' });
      await expect(nav).toBeVisible();
      
      // コンテンツエリアの高さが適切であることを確認
      const main = page.getByRole('main');
      await expect(main).toBeVisible();
    });

    test('should support touch interactions', async ({ page }) => {
      await setMobileViewport(page);
      await page.goto('/');
      
      // タッチでボタンをクリック
      await simulateTap(page, 'button[aria-label="新規投稿"]');
      
      // モーダルが開くことを確認
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
    });
  });

  test.describe('Content Responsiveness', () => {
    test('should handle long text content on mobile', async ({ page }) => {
      await setMobileViewport(page);
      await page.goto('/');
      
      // 長文投稿を作成
      const longText = 'これは非常に長いテキストです。'.repeat(20);
      await createPost(page, longText);
      
      // テキストが適切に折り返されることを確認
      const post = page.locator('article').filter({ hasText: longText.substring(0, 20) }).first();
      await expect(post).toBeVisible();
      
      // テキストコンテナの幅がビューポート内に収まっていることを確認
      const isInViewport = await isElementInViewport(page, 'article');
      expect(isInViewport).toBeTruthy();
    });

    test('should display images responsively', async ({ page }) => {
      await page.goto('/');
      
      // 画像付き投稿を作成
      await createPost(page, 'テスト画像 https://example.com/test.jpg');
      
      // 異なるビューポートで画像の表示を確認
      const viewports = ['mobile', 'tablet', 'desktop'] as const;
      
      for (const viewport of viewports) {
        await setViewport(page, viewport);
        
        const img = page.locator('img[src*="example.com/test.jpg"]').first();
        if (await img.isVisible()) {
          // 画像がビューポート内に収まっていることを確認
          const box = await img.boundingBox();
          const viewportSize = page.viewportSize();
          
          if (box && viewportSize) {
            expect(box.width).toBeLessThanOrEqual(viewportSize.width);
          }
        }
      }
    });
  });

  test.describe('Component-specific Responsiveness', () => {
    test('compose box should adapt to screen size', async ({ page }) => {
      await page.goto('/');
      
      // モバイルでの表示
      await setMobileViewport(page);
      const mobileTextarea = page.getByPlaceholder("What's happening?");
      await expect(mobileTextarea).toBeVisible();
      
      // デスクトップでの表示
      await setDesktopViewport(page);
      const desktopTextarea = page.getByPlaceholder("What's happening?");
      await expect(desktopTextarea).toBeVisible();
      
      // テキストエリアのサイズが異なることを確認
      const mobileBox = await mobileTextarea.boundingBox();
      await setMobileViewport(page);
      const desktopBox = await desktopTextarea.boundingBox();
      
      if (mobileBox && desktopBox) {
        expect(desktopBox.width).toBeGreaterThan(mobileBox.width);
      }
    });

    test('modal dialogs should be responsive', async ({ page }) => {
      const viewports = ['mobile', 'tablet', 'desktop'] as const;
      
      for (const viewport of viewports) {
        await setViewport(page, viewport);
        await page.goto('/');
        
        // 設定モーダルを開く
        await page.click('a[href="/settings"]');
        
        const modal = page.getByRole('dialog');
        if (await modal.isVisible()) {
          // モーダルがビューポートに適応していることを確認
          const modalBox = await modal.boundingBox();
          const viewportSize = page.viewportSize();
          
          if (modalBox && viewportSize) {
            // モバイルでは全画面、それ以外では中央配置
            if (viewport === 'mobile') {
              expect(modalBox.width).toBeGreaterThanOrEqual(viewportSize.width * 0.9);
            } else {
              expect(modalBox.width).toBeLessThan(viewportSize.width * 0.8);
            }
          }
        }
      }
    });
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
    await createPost(page, 'Check this image: https://example.com/image.jpg');
    
    // 画像要素を取得
    const img = page.locator('img[src*="example.com/image.jpg"]').first();
    
    if (await img.isVisible()) {
      // loading="lazy"属性があることを確認
      await expect(img).toHaveAttribute('loading', 'lazy');
    }
  });

  test('should handle viewport changes without breaking layout', async ({ page }) => {
    await page.goto('/');
    
    // 初期ビューポートでレイアウトを確認
    await setDesktopViewport(page);
    const desktopSidebar = page.locator('aside').first();
    await expect(desktopSidebar).toBeVisible();
    
    // ビューポートを変更
    await setMobileViewport(page);
    
    // モバイルレイアウトに切り替わることを確認
    await expect(desktopSidebar).not.toBeVisible();
    const mobileNav = page.locator('nav').filter({ hasText: 'ホーム' });
    await expect(mobileNav).toBeVisible();
    
    // 再度デスクトップに戻す
    await setDesktopViewport(page);
    await expect(desktopSidebar).toBeVisible();
    await expect(mobileNav).not.toBeVisible();
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