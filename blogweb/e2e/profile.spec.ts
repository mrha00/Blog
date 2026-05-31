import { test, expect } from '@playwright/test';
import { loginViaUI } from './helpers';

test.describe('Profile — nickname / password', () => {
  test('logged-in user can open profile and update nickname', async ({ page }) => {
    await loginViaUI(page, 'alice', '123456');
    await page.goto('/profile');
    await expect(page).toHaveURL('/profile');
    await expect(page.getByRole('heading', { name: '个人资料' })).toBeVisible();

    const nickname = `Alice_${Date.now().toString().slice(-4)}`;
    await page.locator('#profile-nickname').fill(nickname);
    await page.getByRole('button', { name: '保存资料' }).click();
    await expect(page.getByText('资料已保存')).toBeVisible();

    await page.goto('/');
    await expect(page.locator('#admin-dropdown-trigger')).toContainText(nickname);
  });
});
