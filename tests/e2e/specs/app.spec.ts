import { test, expect } from '@playwright/test';

test.describe('basic e2e flow', () => {
  test('home renders and allows navigation', async ({ page }) => {
    // NOTE: these tests expect the dev server to be running externally if executed.
    await page.goto('/');
    
    // タイトルの確認
    await expect(page).toHaveTitle('X Clone');
    
    // ホームページのヘッダーが表示されることを確認（ページヘッダー内のもの）
    await expect(page.locator('header').getByRole('heading', { name: 'ホーム' })).toBeVisible();
    
    // ナビゲーションが表示されることを確認（サイドバー内）
    await expect(page.locator('nav').getByRole('link', { name: 'ホーム' })).toBeVisible();
    await expect(page.locator('nav').getByRole('link', { name: '通知' })).toBeVisible();
    await expect(page.locator('nav').getByRole('link', { name: 'プロフィール' })).toBeVisible();
    
    // タブの確認
    await expect(page.getByRole('button', { name: 'おすすめ' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'フォロー中' })).toBeVisible();
  });
  
  test('can navigate between pages', async ({ page }) => {
    await page.goto('/');
    
    // 検索ページへ移動
    await page.getByRole('link', { name: '検索' }).click();
    await expect(page).toHaveURL('/explore');
    
    // 通知ページへ移動
    await page.getByRole('link', { name: '通知' }).click();
    await expect(page).toHaveURL('/notifications');
    
    // プロフィールページへ移動
    await page.getByRole('link', { name: 'プロフィール' }).click();
    await expect(page).toHaveURL('/profile');
    
    // ホームに戻る
    await page.locator('nav').getByRole('link', { name: 'ホーム' }).click();
    await expect(page).toHaveURL('/');
  });
});
