import { test, expect } from '@playwright/test';
import {
  apiLogin,
  apiRequest,
  createPublishedPostViaApi,
  deletePostViaApi,
  loginViaUI,
  openAdminMenu,
} from './helpers';

test.describe('Permissions — author and admin UI', () => {
  let postId: number;
  let adminToken: string;

  test.beforeAll(async () => {
    const auth = await apiLogin('admin', '123456');
    adminToken = auth.token;
    postId = await createPublishedPostViaApi(adminToken, `Perm Test ${Date.now()}`);
  });

  test.afterAll(async () => {
    await deletePostViaApi(adminToken, postId);
  });

  test('regular user does not see admin menu entries', async ({ page }) => {
    await loginViaUI(page, 'alice', '123456');
    await openAdminMenu(page);
    await expect(page.getByRole('link', { name: '分类管理' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: '标签管理' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '退出登录' })).toBeVisible();
  });

  test('regular user cannot see edit/delete on others posts', async ({ page }) => {
    await loginViaUI(page, 'alice', '123456');
    await page.goto(`/posts/${postId}`);
    await expect(page.locator('#article-header h1')).toBeVisible();
    await expect(page.getByRole('link', { name: '编辑文章' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '删除文章' })).not.toBeVisible();
  });

  test('admin sees edit controls on own posts', async ({ page }) => {
    await loginViaUI(page, 'admin', '123456');
    await page.goto(`/posts/${postId}`);
    await expect(page.getByRole('link', { name: '编辑文章' })).toBeVisible();
    await expect(page.getByRole('button', { name: '删除文章' })).toBeVisible();
  });
});

test.describe('Post detail — view count display', () => {
  let postId: number;
  let adminToken: string;

  test.beforeAll(async () => {
    const auth = await apiLogin('admin', '123456');
    adminToken = auth.token;
    postId = await createPublishedPostViaApi(adminToken, `Views Test ${Date.now()}`);
    await apiRequest(`/api/posts/${postId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
  });

  test.afterAll(async () => {
    await deletePostViaApi(adminToken, postId);
  });

  test('shows read count after visiting detail', async ({ page }) => {
    await page.goto(`/posts/${postId}`);
    await expect(page.getByText(/\d+ 次阅读/)).toBeVisible({ timeout: 10_000 });
  });
});
