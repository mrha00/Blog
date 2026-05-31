import { test, expect } from '@playwright/test';
import { loginViaUI } from './helpers';

test.describe('Profile — public page & settings', () => {
  test('logged-in user can open public profile and update bio in settings', async ({ page }) => {
    await loginViaUI(page, 'alice', '123456');

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/users\/\d+$/);
    await expect(page.getByText('个人简介')).toBeVisible();

    const bio = `E2E 简介 ${Date.now().toString().slice(-4)}`;
    await page.goto('/settings');
    await page.locator('#settings-bio').fill(bio);
    await page.getByRole('button', { name: '保存更改' }).click();
    await expect(page.getByText('资料已保存')).toBeVisible();

    await page.goto('/profile');
    await expect(page.getByText(bio)).toBeVisible();
  });

  test('logged-in user can update nickname in settings', async ({ page }) => {
    await loginViaUI(page, 'alice', '123456');
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: '个人资料' })).toBeVisible();

    const nickname = `Alice_${Date.now().toString().slice(-4)}`;
    await page.locator('#settings-nickname').fill(nickname);
    await page.getByRole('button', { name: '保存更改' }).click();
    await expect(page.getByText('资料已保存')).toBeVisible();

    await page.goto('/');
    await expect(page.locator('#admin-dropdown-trigger')).toContainText(nickname);
  });
});
