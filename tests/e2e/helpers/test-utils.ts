import { Page } from '@playwright/test';

/**
 * テスト用のユーティリティ関数
 */

/**
 * 投稿を作成する
 */
export async function createPost(page: Page, content: string) {
  const textarea = page.getByPlaceholder("What's happening?");
  await textarea.fill(content);
  await page.getByRole('button', { name: 'Post' }).click();
  
  // 投稿が表示されるまで待機
  await page.waitForTimeout(500);
}

/**
 * 通知ページに移動してサンプル通知が読み込まれるまで待機
 */
export async function navigateToNotifications(page: Page) {
  await page.goto('/notifications');
  
  // 開発環境では自動でサンプル通知が追加される
  if (process.env.NODE_ENV === 'development') {
    await page.waitForTimeout(1000); // サンプル通知の読み込み待機
  }
}

/**
 * 特定のタブをクリック
 */
export async function clickNotificationTab(page: Page, tabName: string) {
  await page.getByRole('tab', { name: tabName }).click();
  await page.waitForTimeout(300); // タブ切り替えアニメーション待機
}

/**
 * モバイルビューポートに設定
 */
export async function setMobileViewport(page: Page) {
  await page.setViewportSize({ width: 375, height: 667 });
}

/**
 * タブレットビューポートに設定
 */
export async function setTabletViewport(page: Page) {
  await page.setViewportSize({ width: 768, height: 1024 });
}

/**
 * デスクトップビューポートに設定
 */
export async function setDesktopViewport(page: Page) {
  await page.setViewportSize({ width: 1280, height: 720 });
}

/**
 * ダークモードに切り替え
 */
export async function enableDarkMode(page: Page) {
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
}

/**
 * ライトモードに切り替え
 */
export async function enableLightMode(page: Page) {
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
  });
}

/**
 * localStorageをクリア
 */
export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => localStorage.clear());
}

/**
 * 特定の通知タイプを検索
 */
export async function findNotificationByType(page: Page, type: string) {
  const typeToText = {
    'like': 'があなたの投稿にいいねしました',
    'reply': 'があなたの投稿に返信しました',
    'mention': 'があなたをメンションしました',
    'repost': 'があなたの投稿をリポストしました',
    'zap': 'があなたにZapを送りました',
    'follow': 'があなたをフォローしました'
  };
  
  const text = typeToText[type as keyof typeof typeToText];
  if (!text) return null;
  
  return page.locator('article').filter({ hasText: text }).first();
}

/**
 * スクリーンショットを撮影（デバッグ用）
 */
export async function takeDebugScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `tests/e2e/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * ネットワークレスポンスをモック
 */
export async function mockApiResponse(page: Page, url: string, response: any) {
  await page.route(url, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });
}

/**
 * 要素が表示されるまで待機（カスタムタイムアウト付き）
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000) {
  await page.locator(selector).first().waitFor({ 
    state: 'visible', 
    timeout 
  });
}

/**
 * テキストを含む要素が表示されるまで待機
 */
export async function waitForText(page: Page, text: string, timeout = 5000) {
  await page.locator(`text=${text}`).first().waitFor({ 
    state: 'visible', 
    timeout 
  });
}