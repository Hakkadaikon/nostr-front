import { test, expect } from '@playwright/test';
import {
  setMobileViewport,
  setTabletViewport,
  setDesktopViewport,
  setMobileLandscapeViewport,
  setViewport,
  ViewportPresets,
  createPost,
  simulateTap,
  isElementInViewport,
  checkMediaQuery,
} from '../helpers/test-utils';

test.describe('Compose Box Responsiveness', () => {
  test.describe('Text Area Sizing', () => {
    test('should adjust textarea height based on viewport', async ({ page }) => {
      const viewports = ['mobile', 'tablet', 'desktop'] as const;
      
      for (const viewport of viewports) {
        await setViewport(page, viewport);
        await page.goto('/');
        
        const textarea = page.getByPlaceholder("What's happening?");
        await expect(textarea).toBeVisible();
        
        const box = await textarea.boundingBox();
        if (box) {
          // ビューポートに応じて適切な高さ
          if (viewport === 'mobile') {
            expect(box.height).toBeGreaterThanOrEqual(60);
            expect(box.height).toBeLessThanOrEqual(100);
          } else {
            expect(box.height).toBeGreaterThanOrEqual(80);
          }
        }
        
        // 長文を入力したときの自動拡張を確認
        await textarea.fill('これは\nとても\n長い\nテキスト\nです');
        const expandedBox = await textarea.boundingBox();
        if (expandedBox && box) {
          expect(expandedBox.height).toBeGreaterThan(box.height);
        }
      }
    });

    test('should handle landscape orientation on mobile', async ({ page }) => {
      await setMobileLandscapeViewport(page);
      await page.goto('/');
      
      const textarea = page.getByPlaceholder("What's happening?");
      const box = await textarea.boundingBox();
      const viewportSize = page.viewportSize();
      
      if (box && viewportSize) {
        // 横向きでは高さが制限される
        expect(box.height).toBeLessThan(viewportSize.height * 0.4);
      }
    });
  });

  test.describe('Compose Modal', () => {
    test('should display full-screen modal on mobile', async ({ page }) => {
      await setMobileViewport(page);
      await page.goto('/');
      
      // 新規投稿ボタンをクリック
      const composeButton = page.locator('button[aria-label="新規投稿"]');
      await composeButton.click();
      
      // モーダルが全画面で表示される
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      
      const modalBox = await modal.boundingBox();
      const viewportSize = page.viewportSize();
      
      if (modalBox && viewportSize) {
        expect(modalBox.width).toBeGreaterThanOrEqual(viewportSize.width);
        expect(modalBox.height).toBeGreaterThanOrEqual(viewportSize.height * 0.9);
      }
    });

    test('should display centered modal on desktop', async ({ page }) => {
      await setDesktopViewport(page);
      await page.goto('/');
      
      const composeButton = page.locator('button[aria-label="新規投稿"]');
      await composeButton.click();
      
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      
      const modalBox = await modal.boundingBox();
      const viewportSize = page.viewportSize();
      
      if (modalBox && viewportSize) {
        // デスクトップでは中央配置で適切なサイズ
        expect(modalBox.width).toBeLessThan(viewportSize.width * 0.6);
        expect(modalBox.width).toBeGreaterThan(500);
        
        // 中央に配置されていることを確認
        const leftMargin = modalBox.x;
        const rightMargin = viewportSize.width - (modalBox.x + modalBox.width);
        expect(Math.abs(leftMargin - rightMargin)).toBeLessThan(50);
      }
    });
  });

  test.describe('Media Upload', () => {
    test('should adapt media upload interface', async ({ page }) => {
      const viewports = ['mobile', 'desktop'] as const;
      
      for (const viewport of viewports) {
        await setViewport(page, viewport);
        await page.goto('/');
        
        const textarea = page.getByPlaceholder("What's happening?");
        await textarea.click();
        
        // メディアアップロードボタン
        const uploadButton = page.locator('button[aria-label="画像を追加"], [data-testid="media-upload"]');
        
        if (await uploadButton.isVisible()) {
          const buttonBox = await uploadButton.boundingBox();
          if (buttonBox) {
            // モバイルでは大きなタップターゲット
            if (viewport === 'mobile') {
              expect(buttonBox.width).toBeGreaterThanOrEqual(44);
              expect(buttonBox.height).toBeGreaterThanOrEqual(44);
            }
          }
        }
      }
    });

    test('should display media preview responsively', async ({ page }) => {
      await page.goto('/');
      
      // 画像付き投稿をシミュレート
      await createPost(page, 'Test image upload https://example.com/test.jpg');
      
      const viewports = ['mobile', 'tablet', 'desktop'] as const;
      
      for (const viewport of viewports) {
        await setViewport(page, viewport);
        
        // プレビュー画像を確認
        const preview = page.locator('.media-preview, [data-testid="media-preview"]').first();
        if (await preview.isVisible()) {
          const previewBox = await preview.boundingBox();
          const viewportSize = page.viewportSize();
          
          if (previewBox && viewportSize) {
            // ビューポートに応じた適切なサイズ
            if (viewport === 'mobile') {
              expect(previewBox.width).toBeGreaterThanOrEqual(viewportSize.width * 0.8);
            } else {
              expect(previewBox.width).toBeLessThan(viewportSize.width * 0.5);
            }
          }
        }
      }
    });
  });

  test.describe('Character Counter', () => {
    test('should position character counter appropriately', async ({ page }) => {
      const viewports = ['mobile', 'desktop'] as const;
      
      for (const viewport of viewports) {
        await setViewport(page, viewport);
        await page.goto('/');
        
        const textarea = page.getByPlaceholder("What's happening?");
        await textarea.fill('This is a test post with some content');
        
        const charCounter = page.locator('[data-testid="char-counter"], .char-counter');
        if (await charCounter.isVisible()) {
          const isVisible = await isElementInViewport(page, '[data-testid="char-counter"]');
          expect(isVisible).toBeTruthy();
          
          // モバイルでは固定位置、デスクトップでは相対位置
          const position = await charCounter.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.position;
          });
          
          if (viewport === 'mobile') {
            expect(['fixed', 'sticky']).toContain(position);
          }
        }
      }
    });
  });
});

test.describe('Profile Page Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    // サンプルプロフィールページに移動
    await page.goto('/profile/npub1234567890abcdef');
  });

  test.describe('Profile Header', () => {
    test('should stack profile elements on mobile', async ({ page }) => {
      await setMobileViewport(page);
      
      const profileHeader = page.locator('.profile-header, [data-testid="profile-header"]');
      const avatar = profileHeader.locator('img[alt*="avatar"], .avatar');
      const displayName = profileHeader.locator('h1, .display-name');
      const bio = profileHeader.locator('.bio, [data-testid="profile-bio"]');
      
      // 垂直配置を確認
      const avatarBox = await avatar.boundingBox();
      const nameBox = await displayName.boundingBox();
      const bioBox = await bio.boundingBox();
      
      if (avatarBox && nameBox && bioBox) {
        // アバターの下に名前、その下にbioが配置される
        expect(nameBox.y).toBeGreaterThan(avatarBox.y + avatarBox.height);
        expect(bioBox.y).toBeGreaterThan(nameBox.y + nameBox.height);
      }
    });

    test('should display side-by-side on desktop', async ({ page }) => {
      await setDesktopViewport(page);
      
      const profileHeader = page.locator('.profile-header, [data-testid="profile-header"]');
      const avatar = profileHeader.locator('img[alt*="avatar"], .avatar');
      const info = profileHeader.locator('.profile-info, [data-testid="profile-info"]');
      
      // 横並び配置を確認
      const avatarBox = await avatar.boundingBox();
      const infoBox = await info.boundingBox();
      
      if (avatarBox && infoBox) {
        // アバターと情報が横並び
        expect(infoBox.x).toBeGreaterThan(avatarBox.x + avatarBox.width);
        expect(Math.abs(avatarBox.y - infoBox.y)).toBeLessThan(50);
      }
    });

    test('should resize avatar based on screen size', async ({ page }) => {
      const viewports = ['mobile', 'tablet', 'desktop'] as const;
      const expectedSizes = { mobile: 80, tablet: 100, desktop: 120 };
      
      for (const viewport of viewports) {
        await setViewport(page, viewport);
        
        const avatar = page.locator('img[alt*="avatar"], .avatar').first();
        const box = await avatar.boundingBox();
        
        if (box) {
          const expectedSize = expectedSizes[viewport];
          expect(box.width).toBeGreaterThanOrEqual(expectedSize - 20);
          expect(box.width).toBeLessThanOrEqual(expectedSize + 20);
        }
      }
    });
  });

  test.describe('Profile Stats', () => {
    test('should display stats in compact format on mobile', async ({ page }) => {
      await setMobileViewport(page);
      
      const statsContainer = page.locator('.profile-stats, [data-testid="profile-stats"]');
      const statItems = statsContainer.locator('.stat-item, [data-testid="stat-item"]');
      
      const count = await statItems.count();
      expect(count).toBeGreaterThan(0);
      
      // モバイルでは横一列に配置
      const firstStat = statItems.first();
      const lastStat = statItems.last();
      
      const firstBox = await firstStat.boundingBox();
      const lastBox = await lastStat.boundingBox();
      
      if (firstBox && lastBox) {
        // 同じ行に配置されている
        expect(Math.abs(firstBox.y - lastBox.y)).toBeLessThan(10);
      }
    });

    test('should display expanded stats on desktop', async ({ page }) => {
      await setDesktopViewport(page);
      
      const statItems = page.locator('.stat-item, [data-testid="stat-item"]');
      const firstItem = statItems.first();
      
      if (await firstItem.isVisible()) {
        // デスクトップではラベルとカウントが表示される
        const label = firstItem.locator('.stat-label, span').first();
        const count = firstItem.locator('.stat-count, span').last();
        
        await expect(label).toBeVisible();
        await expect(count).toBeVisible();
      }
    });
  });

  test.describe('Profile Tabs', () => {
    test('should scroll tabs on mobile if needed', async ({ page }) => {
      await setMobileViewport(page);
      
      const tabsContainer = page.locator('[role="tablist"]');
      const tabs = tabsContainer.locator('[role="tab"]');
      
      const tabCount = await tabs.count();
      
      if (tabCount > 3) {
        // 3つ以上のタブがある場合はスクロール可能
        const containerBox = await tabsContainer.boundingBox();
        const lastTabBox = await tabs.last().boundingBox();
        
        if (containerBox && lastTabBox) {
          // 最後のタブが最初は見えない可能性
          const isScrollable = await tabsContainer.evaluate(el => {
            return el.scrollWidth > el.clientWidth;
          });
          
          expect(isScrollable).toBeTruthy();
        }
      }
    });

    test('should display all tabs on desktop', async ({ page }) => {
      await setDesktopViewport(page);
      
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      
      // すべてのタブが表示される
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        await expect(tab).toBeVisible();
      }
    });
  });

  test.describe('Edit Profile Modal', () => {
    test('should display full-screen edit modal on mobile', async ({ page }) => {
      await setMobileViewport(page);
      
      const editButton = page.locator('button:has-text("プロフィールを編集"), button[aria-label="Edit profile"]');
      if (await editButton.isVisible()) {
        await editButton.click();
        
        const modal = page.getByRole('dialog');
        await expect(modal).toBeVisible();
        
        const modalBox = await modal.boundingBox();
        const viewportSize = page.viewportSize();
        
        if (modalBox && viewportSize) {
          // モバイルでは全画面
          expect(modalBox.width).toBeGreaterThanOrEqual(viewportSize.width);
          expect(modalBox.height).toBeGreaterThanOrEqual(viewportSize.height * 0.9);
        }
      }
    });

    test('should display centered modal on desktop', async ({ page }) => {
      await setDesktopViewport(page);
      
      const editButton = page.locator('button:has-text("プロフィールを編集"), button[aria-label="Edit profile"]');
      if (await editButton.isVisible()) {
        await editButton.click();
        
        const modal = page.getByRole('dialog');
        const modalBox = await modal.boundingBox();
        const viewportSize = page.viewportSize();
        
        if (modalBox && viewportSize) {
          // デスクトップでは中央配置
          expect(modalBox.width).toBeLessThan(viewportSize.width * 0.6);
          expect(modalBox.width).toBeGreaterThan(400);
        }
      }
    });
  });

  test.describe('Follow Button', () => {
    test('should be easily tappable on mobile', async ({ page }) => {
      await setMobileViewport(page);
      
      const followButton = page.locator('button:has-text("フォロー"), button:has-text("Follow")').first();
      if (await followButton.isVisible()) {
        const box = await followButton.boundingBox();
        if (box) {
          // モバイルタップターゲットの最小サイズ（44x44px）
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });
});