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
 * 大画面デスクトップビューポートに設定
 */
export async function setLargeDesktopViewport(page: Page) {
  await page.setViewportSize({ width: 1920, height: 1080 });
}

/**
 * 大型モバイルビューポートに設定（iPhone 14 Pro Max相当）
 */
export async function setLargeMobileViewport(page: Page) {
  await page.setViewportSize({ width: 414, height: 896 });
}

/**
 * 横向きモバイルビューポートに設定
 */
export async function setMobileLandscapeViewport(page: Page) {
  await page.setViewportSize({ width: 667, height: 375 });
}

/**
 * 横向きタブレットビューポートに設定
 */
export async function setTabletLandscapeViewport(page: Page) {
  await page.setViewportSize({ width: 1024, height: 768 });
}

/**
 * ビューポートサイズのプリセット
 */
export const ViewportPresets = {
  // モバイル
  mobileSmall: { width: 320, height: 568 }, // iPhone SE
  mobile: { width: 375, height: 667 }, // iPhone 8
  mobileLarge: { width: 414, height: 896 }, // iPhone 14 Pro Max
  mobileLandscape: { width: 667, height: 375 },
  
  // タブレット
  tabletPortrait: { width: 768, height: 1024 }, // iPad
  tabletLandscape: { width: 1024, height: 768 },
  
  // デスクトップ
  desktop: { width: 1280, height: 720 },
  desktopLarge: { width: 1920, height: 1080 },
  desktopUltrawide: { width: 2560, height: 1080 },
} as const;

/**
 * カスタムビューポートに設定
 */
export async function setViewport(page: Page, preset: keyof typeof ViewportPresets) {
  await page.setViewportSize(ViewportPresets[preset]);
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

/**
 * タッチイベントをシミュレート
 */
export async function simulateTap(page: Page, selector: string) {
  const element = page.locator(selector).first();
  const box = await element.boundingBox();
  if (!box) throw new Error(`Element ${selector} not found`);
  
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

/**
 * スワイプジェスチャーをシミュレート
 */
export async function simulateSwipe(page: Page, direction: 'left' | 'right' | 'up' | 'down', distance = 200) {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('No viewport size set');
  
  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  
  let endX = centerX;
  let endY = centerY;
  
  switch (direction) {
    case 'left':
      endX = centerX - distance;
      break;
    case 'right':
      endX = centerX + distance;
      break;
    case 'up':
      endY = centerY - distance;
      break;
    case 'down':
      endY = centerY + distance;
      break;
  }
  
  await page.touchscreen.swipe({
    startX: centerX,
    startY: centerY,
    endX,
    endY,
    steps: 10
  });
}

/**
 * 要素がビューポート内に表示されているか確認
 */
export async function isElementInViewport(page: Page, selector: string) {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }, selector);
}

/**
 * メディアクエリの状態を確認
 */
export async function checkMediaQuery(page: Page, query: string) {
  return await page.evaluate((q) => window.matchMedia(q).matches, query);
}