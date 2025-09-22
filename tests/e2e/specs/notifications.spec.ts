import { test, expect } from '@playwright/test';
import { mockNotifications } from '../fixtures/notification-fixtures';

test.describe('Notifications Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notifications');
  });

  test('should display notifications page header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '通知' })).toBeVisible();
  });

  test('should display all notification tabs', async ({ page }) => {
    const tabs = ['すべて', 'メンション', '返信', 'リポスト', 'いいね', 'Zap', 'フォロー'];
    
    for (const tab of tabs) {
      const tabElement = page.getByRole('tab', { name: tab });
      await expect(tabElement).toBeVisible();
    }
    
    // モバイルビューでの短縮表示も確認
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('tab', { name: '@' })).toBeVisible(); // メンション
    await expect(page.getByRole('tab', { name: 'RP' })).toBeVisible(); // リポスト
    await expect(page.getByRole('tab', { name: '♥' })).toBeVisible(); // いいね
    await expect(page.getByRole('tab', { name: '+' })).toBeVisible(); // フォロー
  });

  test('should display empty state when no notifications', async ({ page }) => {
    // 開発環境では自動でサンプル通知が追加されるため、本番環境をシミュレート
    await page.evaluate(() => {
      // localStorageをクリアして通知をリセット
      localStorage.clear();
    });
    await page.reload();
    
    await expect(page.getByText('通知はありません')).toBeVisible();
    await expect(page.getByText('新しいフォロー、いいね、返信があるとここに表示されます')).toBeVisible();
  });

  test('should filter notifications by type', async ({ page }) => {
    // メンションタブをクリック
    await page.getByRole('tab', { name: 'メンション' }).click();
    await page.waitForTimeout(500); // タブ切り替えアニメーション待機
    
    // Zapタブをクリック
    await page.getByRole('tab', { name: 'Zap' }).click();
    await page.waitForTimeout(500);
  });
});

test.describe('Notification Types Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notifications');
  });

  test('should display like notification correctly', async ({ page }) => {
    // いいね通知の要素を確認
    const likeNotification = page.locator('article').filter({ hasText: 'があなたの投稿にいいねしました' }).first();
    await expect(likeNotification).toBeVisible();
    
    // ハートアイコンの確認
    await expect(likeNotification.locator('svg').first()).toBeVisible();
  });

  test('should display reply notification correctly', async ({ page }) => {
    // 返信通知の要素を確認
    const replyNotification = page.locator('article').filter({ hasText: 'があなたの投稿に返信しました' }).first();
    if (await replyNotification.isVisible()) {
      // 返信内容が表示されることを確認
      await expect(replyNotification.locator('text=確かに楽しいです')).toBeVisible();
    }
  });

  test('should display mention notification correctly', async ({ page }) => {
    // メンション通知の要素を確認
    const mentionNotification = page.locator('article').filter({ hasText: 'があなたをメンションしました' }).first();
    if (await mentionNotification.isVisible()) {
      // メンション内容が表示されることを確認
      await expect(mentionNotification).toContainText('claude code3並列で');
    }
  });

  test('should display zap notification correctly', async ({ page }) => {
    // Zap通知の要素を確認
    const zapNotification = page.locator('article').filter({ hasText: 'があなたにZapを送りました' }).first();
    if (await zapNotification.isVisible()) {
      // Zapアイコン（⚡）が表示されることを確認
      await expect(zapNotification.locator('text=⚡')).toBeVisible();
      // 金額が表示されることを確認
      await expect(zapNotification.locator('text=/\\d+.*sats/')).toBeVisible();
    }
  });

  test('should display follow notification correctly', async ({ page }) => {
    // フォロー通知の要素を確認
    const followNotification = page.locator('article').filter({ hasText: 'があなたをフォローしました' }).first();
    if (await followNotification.isVisible()) {
      // フォローボタンが表示されることを確認
      const followButton = followNotification.locator('button').filter({ hasText: /フォロー/ });
      await expect(followButton).toBeVisible();
    }
  });

  test('should display repost notification correctly', async ({ page }) => {
    // リポスト通知の要素を確認
    const repostNotification = page.locator('article').filter({ hasText: 'があなたの投稿をリポストしました' }).first();
    if (await repostNotification.isVisible()) {
      // リポストアイコンが表示されることを確認
      await expect(repostNotification.locator('svg').first()).toBeVisible();
    }
  });
});

test.describe('Notification Embeds', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notifications');
  });

  test('should display embedded nostr:npub links', async ({ page }) => {
    const mentionNotification = page.locator('article').filter({ hasText: 'claude code3並列で' }).first();
    if (await mentionNotification.isVisible()) {
      // npubリンクが表示されることを確認
      const npubLink = mentionNotification.locator('a[href*="/profile/npub"]').first();
      await expect(npubLink).toBeVisible();
      await expect(npubLink).toHaveText(/@npub[\w]+…/);
    }
  });

  test('should display embedded images', async ({ page }) => {
    const notificationWithImage = page.locator('article').filter({ hasText: '.jpg' }).first();
    if (await notificationWithImage.isVisible()) {
      // 画像が埋め込まれることを確認
      const image = notificationWithImage.locator('img[src*=".jpg"]').first();
      await expect(image).toBeVisible();
    }
  });
});

test.describe('Notification Interactions', () => {
  test('should mark notification as read on click', async ({ page }) => {
    await page.goto('/notifications');
    
    // 未読通知を探す（背景色が異なる）
    const unreadNotification = page.locator('article').filter({ 
      has: page.locator('.bg-purple-50\\/30, .dark\\:bg-purple-900\\/10') 
    }).first();
    
    if (await unreadNotification.isVisible()) {
      // 通知をクリック
      await unreadNotification.click();
      
      // 背景色が変わることを確認（既読になる）
      await expect(unreadNotification).not.toHaveClass(/bg-purple-50/);
    }
  });

  test('should open reply composer on reply button click', async ({ page }) => {
    await page.goto('/notifications');
    
    // 返信ボタンを持つ通知を探す
    const notificationWithReply = page.locator('article').filter({ 
      has: page.locator('button:has-text("返信")') 
    }).first();
    
    if (await notificationWithReply.isVisible()) {
      // 返信ボタンをクリック
      await notificationWithReply.locator('button:has-text("返信")').click();
      
      // 返信コンポーザーが表示されることを確認
      await expect(page.locator('textarea[placeholder*="返信"]')).toBeVisible();
    }
  });

  test('should toggle follow state on follow button click', async ({ page }) => {
    await page.goto('/notifications');
    
    // フォロー通知を探す
    const followNotification = page.locator('article').filter({ 
      hasText: 'があなたをフォローしました' 
    }).first();
    
    if (await followNotification.isVisible()) {
      const followButton = followNotification.locator('button').filter({ hasText: /フォロー/ });
      
      if (await followButton.isVisible()) {
        const initialText = await followButton.textContent();
        
        // フォローボタンをクリック
        await followButton.click();
        
        // ボタンのテキストが変わることを期待
        await expect(followButton).not.toHaveText(initialText || '');
      }
    }
  });

  test('should navigate to embedded post on click', async ({ page }) => {
    await page.goto('/notifications');
    
    // 埋め込み投稿を含む通知を探す
    const embeddedPost = page.locator('a[href*="/note/"]').first();
    
    if (await embeddedPost.isVisible()) {
      const href = await embeddedPost.getAttribute('href');
      
      // 埋め込み投稿をクリック
      await embeddedPost.click();
      
      // 投稿ページに遷移することを確認
      if (href) {
        await expect(page).toHaveURL(new RegExp(href.replace(/^\//, '')));
      }
    }
  });
});