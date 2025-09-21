import { test, expect } from '@playwright/test';

test.describe('basic e2e flow', () => {
  test('home renders and allows composing', async ({ page }) => {
    // NOTE: these tests expect the dev server to be running externally if executed.
    await page.goto('/');
    await expect(page.getByText('Nostr Web Client')).toBeVisible();
    const ta = page.getByPlaceholder("What's happening?");
    await ta.fill('hello');
    await page.getByRole('button', { name: 'Post' }).click();
  });
});
