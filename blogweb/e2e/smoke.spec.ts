import { test, expect } from '@playwright/test';

test.describe('Smoke — all routes load', () => {
  test('home page renders header and search', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'BlogWeb' })).toBeVisible();
    await expect(page.getByPlaceholder('键入关键字搜索文章...')).toBeVisible();
    await expect(page.getByRole('button', { name: '搜索' })).toBeVisible();
  });

  test('login page renders form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible();
    await expect(page.getByRole('button', { name: '确定登录' })).toBeVisible();
  });

  test('register page renders form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: '加入 BlogWeb' })).toBeVisible();
    await expect(page.getByRole('button', { name: '注册并登录' })).toBeVisible();
  });

  test('editor redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/editor');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('categories redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/categories');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('tags redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/tags');
    await expect(page).toHaveURL(/\/login$/);
  });
});
