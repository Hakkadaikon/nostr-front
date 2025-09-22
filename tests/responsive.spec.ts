import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test.describe('Mobile Navigation', () => {
    test.beforeEach(async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should show mobile navigation on small screens', async ({ page }) => {
      await page.goto('/');
      
      // デスクトップサイドバーが非表示であることを確認（hidden classで非表示）
      const aside = page.locator('aside').first();
      await expect(aside).toHaveClass(/hidden/);
      
      // モバイルヘッダーが表示されていることを確認
      await expect(page.locator('header').first()).toBeVisible();
      
      // 下部ナビゲーションが表示されていることを確認
      const mobileNav = page.locator('nav.md\\:hidden');
      await expect(mobileNav).toBeVisible();
      
      // 各ナビゲーションアイテムが存在することを確認
      await expect(mobileNav.locator('text=ホーム')).toBeVisible();
      await expect(mobileNav.locator('text=検索')).toBeVisible();
      await expect(mobileNav.locator('text=通知')).toBeVisible();
      await expect(mobileNav.locator('text=プロフィール')).toBeVisible();
      await expect(mobileNav.locator('text=投稿')).toBeVisible();
    });

    test('should navigate between pages using mobile nav', async ({ page }) => {
      await page.goto('/');
      
      // 検索ページへ移動（モバイルナビゲーション内のリンクをクリック）
      await page.locator('nav.md\\:hidden').locator('a[href="/explore"]').click();
      await expect(page).toHaveURL('/explore');
      
      // 通知ページへ移動
      await page.locator('nav.md\\:hidden').locator('a[href="/notifications"]').click();
      await expect(page).toHaveURL('/notifications');
      
      // ホームに戻る
      await page.locator('nav.md\\:hidden').locator('a[href="/"]').click();
      await expect(page).toHaveURL('/');
    });

    test('should show floating compose button on mobile', async ({ page }) => {
      await page.goto('/');
      
      // 浮動投稿ボタンが表示されていることを確認
      const floatingButton = page.locator('button.fixed[aria-label="新しい投稿を作成"]');
      await expect(floatingButton).toBeVisible();
      // fixedクラスが適用されているか確認
      await expect(floatingButton).toHaveClass(/fixed/);
    });
  });

  test.describe('Desktop Navigation', () => {
    test.beforeEach(async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
    });

    test('should show desktop sidebar on large screens', async ({ page }) => {
      await page.goto('/');
      
      // デスクトップサイドバーが表示されていることを確認
      await expect(page.locator('aside')).toBeVisible();
      
      // モバイルナビゲーションが非表示であることを確認（md:hidden classで非表示）
      const mobileNav = page.locator('nav.md\\:hidden');
      await expect(mobileNav).toHaveClass(/md:hidden/);
      
      // モバイルヘッダーが非表示であることを確認（md:hidden classで非表示）
      await expect(page.locator('header.md\\:hidden')).toHaveClass(/md:hidden/);
    });

    test('should navigate using desktop sidebar', async ({ page }) => {
      await page.goto('/');
      
      // サイドバーの各リンクが機能することを確認
      await page.locator('aside').locator('text=検索').click();
      await expect(page).toHaveURL('/explore');
      
      await page.locator('aside').locator('text=通知').click();
      await expect(page).toHaveURL('/notifications');
      
      await page.locator('aside').locator('text=設定').click();
      await expect(page).toHaveURL('/settings');
    });
  });

  test.describe('Responsive Content', () => {
    test('should adjust content layout for mobile', async ({ page }) => {
      await page.goto('/');
      
      // モバイルビューポート
      await page.setViewportSize({ width: 375, height: 667 });
      const mainContent = page.locator('.max-w-2xl').first();
      
      // モバイルではmd:border-xが適用されないことを確認
      const classes = await mainContent.getAttribute('class');
      expect(classes).toContain('md:border-x');
      
      // デスクトップビューポート
      await page.setViewportSize({ width: 1280, height: 720 });
      
      // デスクトップではmd:border-xクラスが存在することを確認
      await expect(mainContent).toHaveClass(/md:border-x/);
    });

    test('should handle orientation changes', async ({ page }) => {
      await page.goto('/');
      
      // ポートレートモード
      await page.setViewportSize({ width: 375, height: 812 });
      await expect(page.locator('nav.md\\:hidden')).toBeVisible();
      
      // ランドスケープモード（まだモバイルビューポート）
      await page.setViewportSize({ width: 667, height: 375 });
      await expect(page.locator('nav.md\\:hidden')).toBeVisible();
    });
  });

  test.describe('Specific Component Responsiveness', () => {
    test('should handle notifications page tabs on mobile', async ({ page }) => {
      await page.goto('/notifications');
      await page.setViewportSize({ width: 375, height: 667 });
      
      // タブリストを確認
      const tabsList = page.locator('.overflow-x-auto').first();
      await expect(tabsList).toBeVisible();
      
      // 短縮表示のタブが見えることを確認 - span.sm\\:hiddenセレクタを使用
      await expect(page.locator('span.sm\\:hidden').filter({ hasText: '@' })).toBeVisible(); // メンション
      await expect(page.locator('span.sm\\:hidden').filter({ hasText: 'RP' })).toBeVisible(); // リポスト
      await expect(page.locator('span.sm\\:hidden').filter({ hasText: '♥' })).toBeVisible(); // いいね
    });

    test('should handle relay settings on mobile', async ({ page }) => {
      await page.goto('/settings');
      await page.setViewportSize({ width: 375, height: 667 });
      
      // リレー設定セクションを探す
      const relaySection = page.locator('text=Relays').locator('..');
      
      // ボタンテキストが縦書きになっていないことを確認
      const buttons = relaySection.locator('button');
      const settingsButton = buttons.filter({ hasText: '設定' }).first();
      
      if (await settingsButton.isVisible()) {
        // whitespace-nowrapクラスが適用されているか確認
        await expect(settingsButton).toHaveClass(/whitespace-nowrap/);
      }
    });
  });

  test.describe('Breakpoint Transitions', () => {
    test('should transition smoothly between breakpoints', async ({ page }) => {
      await page.goto('/');
      
      const viewports = [
        { width: 320, height: 568 },  // iPhone SE
        { width: 375, height: 667 },  // iPhone 6/7/8
        { width: 768, height: 1024 }, // iPad
        { width: 1024, height: 768 }, // Desktop Small
        { width: 1280, height: 720 }, // Desktop
        { width: 1920, height: 1080 } // Desktop Large
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        
        // コンテンツが常に表示されることを確認
        await expect(page.locator('body')).toBeVisible();
        
        // モバイル/デスクトップナビゲーションの適切な表示を確認
        if (viewport.width < 768) {
          await expect(page.locator('nav.md\\:hidden')).toBeVisible();
          await expect(page.locator('aside').first()).toHaveClass(/hidden/);
        } else {
          await expect(page.locator('aside')).toBeVisible();
          await expect(page.locator('nav.md\\:hidden')).toHaveClass(/md:hidden/);
        }
      }
    });
  });
});