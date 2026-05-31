import { test, expect } from '@playwright/test';
import { loginViaUI, logoutViaUI } from './helpers';

test.describe('Auth — login / register / logout', () => {
  test('admin can login and logout', async ({ page }) => {
    await loginViaUI(page, 'admin', '123456');
    await expect(page.locator('#admin-dropdown-trigger')).toContainText('博客管理员');
    await logoutViaUI(page);
    await expect(page.getByRole('link', { name: '登录' })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-username').fill('admin');
    await page.locator('#login-password').fill('wrong-password');
    await page.getByRole('button', { name: '确定登录' }).click();
    await expect(page.getByText(/登录失败/)).toBeVisible();
  });

  test('register new user and auto-login', async ({ page }) => {
    const username = `e2e_${Date.now()}`;
    await page.goto('/register');
    await page.getByPlaceholder('例如: coding_fox').fill(username);
    await page.getByPlaceholder('在评论区和文章页展示的名称').fill(`昵称${username.slice(-4)}`);
    await page.getByPlaceholder('you@example.com').fill(`${username}@test.com`);
    await page.getByPlaceholder('至少 6 个字符').fill('123456');
    await page.getByPlaceholder('请再次填写您的密码').fill('123456');
    await page.getByRole('button', { name: '注册并登录' }).click();
    await page.waitForURL('/', { timeout: 15_000 });
    await expect(page.getByRole('link', { name: '撰写' })).toBeVisible();
  });

  test('regular user cannot access admin-only categories page', async ({ page }) => {
    await loginViaUI(page, 'alice', '123456');
    await page.goto('/categories');
    await expect(page).toHaveURL('/');
  });

  test('regular user cannot access admin-only tags page', async ({ page }) => {
    await loginViaUI(page, 'alice', '123456');
    await page.goto('/tags');
    await expect(page).toHaveURL('/');
  });
});
