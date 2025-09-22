import { test, expect } from '@playwright/test';
import {
  setMobileViewport,
  setTabletViewport,
  setDesktopViewport,
  setLargeMobileViewport,
  navigateToNotifications,
  clickNotificationTab,
  findNotificationByType,
  simulateTap,
  simulateSwipe,
  checkMediaQuery,
} from '../helpers/test-utils';

test.describe('Notifications Responsiveness', () => {
  test.describe('Tab Navigation', () => {
    test('should display scrollable tabs on mobile', async ({ page }) => {
      await setMobileViewport(page);
      await navigateToNotifications(page);
      
      // タブコンテナを取得
      const tabContainer = page.locator('.overflow-x-auto').first();
      await expect(tabContainer).toBeVisible();
      
      // スクロール可能であることを確認
      const isScrollable = await tabContainer.evaluate(el => {
        return el.scrollWidth > el.clientWidth;
      });
      expect(isScrollable).toBeTruthy();
      
      // 短縮表示のタブを確認
      await expect(page.getByRole('tab', { name: '@' })).toBeVisible(); // メンション
      await expect(page.getByRole('tab', { name: 'RP' })).toBeVisible(); // リポスト
      await expect(page.getByRole('tab', { name: '♥' })).toBeVisible(); // いいね
      await expect(page.getByRole('tab', { name: '⚡' })).toBeVisible(); // Zap
    });

    test('should display full tab labels on desktop', async ({ page }) => {
      await setDesktopViewport(page);
      await navigateToNotifications(page);
      
      // デスクトップではフルラベルが表示される
      await expect(page.getByRole('tab', { name: 'すべて' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'メンション' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'リポスト' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'いいね' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Zap' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'フォロー' })).toBeVisible();
    });

    test('should handle swipe gestures on mobile', async ({ page }) => {
      await setMobileViewport(page);
      await navigateToNotifications(page);
      
      // 初期タブを確認
      const allTab = page.getByRole('tab', { name: 'すべて' });
      await expect(allTab).toHaveAttribute('aria-selected', 'true');
      
      // 左にスワイプして次のタブへ
      await simulateSwipe(page, 'left');
      await page.waitForTimeout(300);
      
      // メンションタブがアクティブになることを確認
      const mentionTab = page.getByRole('tab', { name: '@' });
      await expect(mentionTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('Notification Items', () => {
    test('should display compact notifications on mobile', async ({ page }) => {
      await setMobileViewport(page);
      await navigateToNotifications(page);
      
      const notification = await findNotificationByType(page, 'like');
      if (notification) {
        const box = await notification.boundingBox();
        const viewportSize = page.viewportSize();
        
        if (box && viewportSize) {
          // モバイルでは通知が全幅表示
          expect(box.width).toBeGreaterThanOrEqual(viewportSize.width * 0.95);
          
          // 高さがコンパクトであることを確認
          expect(box.height).toBeLessThan(150);
        }
      }
    });

    test('should display expanded notifications on desktop', async ({ page }) => {
      await setDesktopViewport(page);
      await navigateToNotifications(page);
      
      const notification = await findNotificationByType(page, 'reply');
      if (notification) {
        // デスクトップでは返信内容が表示される
        const replyContent = notification.locator('.reply-content, [data-testid="reply-content"]');
        await expect(replyContent).toBeVisible();
      }
    });

    test('should handle action buttons responsively', async ({ page }) => {
      const viewports = ['mobile', 'desktop'] as const;
      
      for (const viewport of viewports) {
        await setViewport(page, viewport);
        await navigateToNotifications(page);
        
        const notification = await findNotificationByType(page, 'like');
        if (notification) {
          const actionButtons = notification.locator('button');
          const buttonCount = await actionButtons.count();
          
          if (viewport === 'mobile') {
            // モバイルではアイコンのみ
            for (let i = 0; i < buttonCount; i++) {
              const button = actionButtons.nth(i);
              const text = await button.textContent();
              expect(text?.length).toBeLessThan(3); // アイコンまたは数字のみ
            }
          } else {
            // デスクトップではツールチップまたはラベル付き
            const firstButton = actionButtons.first();
            const hasTooltip = await firstButton.getAttribute('title') || 
                               await firstButton.getAttribute('aria-label');
            expect(hasTooltip).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Notification Groups', () => {
    test('should collapse notification groups on mobile', async ({ page }) => {
      await setMobileViewport(page);
      await navigateToNotifications(page);
      
      // グループ化された通知を探す
      const groupedNotification = page.locator('[data-notification-group], .notification-group').first();
      if (await groupedNotification.isVisible()) {
        // モバイルでは折りたたまれて表示
        const expandButton = groupedNotification.locator('button').filter({ hasText: /もっと見る|expand/i });
        await expect(expandButton).toBeVisible();
        
        // タップして展開
        await simulateTap(page, 'button:has-text("もっと見る")');
        
        // 展開されたことを確認
        const expandedContent = groupedNotification.locator('.expanded-content, [data-expanded="true"]');
        await expect(expandedContent).toBeVisible();
      }
    });

    test('should display full groups on desktop', async ({ page }) => {
      await setDesktopViewport(page);
      await navigateToNotifications(page);
      
      const groupedNotification = page.locator('[data-notification-group], .notification-group').first();
      if (await groupedNotification.isVisible()) {
        // デスクトップでは最初から展開表示
        const users = groupedNotification.locator('.user-avatar, [data-testid="user-avatar"]');
        const userCount = await users.count();
        
        // 複数のユーザーアバターが表示されることを確認
        expect(userCount).toBeGreaterThan(1);
      }
    });
  });

  test.describe('Large Mobile Devices', () => {
    test('should optimize for large mobile screens', async ({ page }) => {
      await setLargeMobileViewport(page);
      await navigateToNotifications(page);
      
      // 大型モバイルではタブラベルが少し長く表示される可能性
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      
      // すべてのタブが一度に表示されるか確認
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        await expect(tab).toBeVisible();
      }
      
      // アクションボタンが適切なサイズであることを確認
      const actionButton = page.locator('button[aria-label="いいね"]').first();
      if (await actionButton.isVisible()) {
        const box = await actionButton.boundingBox();
        if (box) {
          // タップターゲットが十分大きいことを確認（44px以上）
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  test.describe('Notification Settings', () => {
    test('should display settings appropriately on different screens', async ({ page }) => {
      const viewports = ['mobile', 'tablet', 'desktop'] as const;
      
      for (const viewport of viewports) {
        await setViewport(page, viewport);
        await navigateToNotifications(page);
        
        // 設定ボタンを探す
        const settingsButton = page.locator('button[aria-label="通知設定"], [data-testid="notification-settings"]').first();
        
        if (await settingsButton.isVisible()) {
          await settingsButton.click();
          
          const settingsModal = page.getByRole('dialog');
          await expect(settingsModal).toBeVisible();
          
          const modalBox = await settingsModal.boundingBox();
          const viewportSize = page.viewportSize();
          
          if (modalBox && viewportSize) {
            if (viewport === 'mobile') {
              // モバイルでは全画面モーダル
              expect(modalBox.width).toBeGreaterThanOrEqual(viewportSize.width * 0.95);
              expect(modalBox.height).toBeGreaterThanOrEqual(viewportSize.height * 0.8);
            } else {
              // デスクトップでは中央配置のモーダル
              expect(modalBox.width).toBeLessThan(viewportSize.width * 0.6);
            }
          }
          
          // モーダルを閉じる
          await page.keyboard.press('Escape');
        }
      }
    });
  });

  test.describe('Performance on Mobile', () => {
    test('should handle long notification lists efficiently', async ({ page }) => {
      await setMobileViewport(page);
      await navigateToNotifications(page);
      
      // スクロールパフォーマンスをテスト
      const notificationList = page.locator('[role="feed"], .notification-list').first();
      
      if (await notificationList.isVisible()) {
        // 仮想スクロールが実装されているか確認
        const hasVirtualScroll = await notificationList.evaluate(el => {
          const children = el.children;
          const containerHeight = el.clientHeight;
          const contentHeight = el.scrollHeight;
          
          // コンテンツの高さがコンテナの3倍以上なら仮想スクロールの可能性
          return contentHeight > containerHeight * 3 && children.length < 50;
        });
        
        // 無限スクロールが機能することを確認
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000); // 新しい通知の読み込み待機
        
        const newNotifications = await notificationList.locator('article').count();
        expect(newNotifications).toBeGreaterThan(0);
      }
    });
  });
});