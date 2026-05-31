import { test, expect } from '@playwright/test';
import {
  apiLogin,
  createPublishedPostViaApi,
  deletePostViaApi,
  loginViaUI,
} from './helpers';

test.describe.configure({ mode: 'serial' });

test.describe('Posts — create / list / search / edit / delete', () => {
  let adminToken: string;
  let createdPostId: number | null = null;
  const postTitle = `E2E Post ${Date.now()}`;
  const updatedTitle = `${postTitle} (edited)`;

  test.beforeAll(async () => {
    const auth = await apiLogin('admin', '123456');
    adminToken = auth.token;
  });

  test.afterAll(async () => {
    if (createdPostId) {
      await deletePostViaApi(adminToken, createdPostId);
    }
  });

  test('admin creates and publishes a post via editor', async ({ page }) => {
    await loginViaUI(page, 'admin', '123456');
    await page.getByRole('link', { name: '撰写' }).click();
    await expect(page).toHaveURL(/\/editor$/);
    await expect(page.getByText('撰写全新发布')).toBeVisible();

    await page.getByPlaceholder('填写一个足够吸引读者的标题').fill(postTitle);
    await page.locator('select').selectOption({ index: 1 });
    await page
      .getByPlaceholder(/键入您的文章内容/)
      .fill('# E2E Test\n\nThis is a full-stack test article body.');
    await page.getByRole('button', { name: '确定提交' }).click();

    await page.waitForURL(/\/posts\/\d+$/);
    await expect(page.locator('#article-header h1')).toContainText(postTitle);

    const match = page.url().match(/\/posts\/(\d+)/);
    createdPostId = match ? Number(match[1]) : null;
  });

  test('home lists the new post and search finds it', async ({ page }) => {
    test.skip(!createdPostId, 'Post was not created');

    await page.goto('/');
    await expect(page.getByRole('link', { name: postTitle })).toBeVisible({ timeout: 15_000 });

    await page.getByPlaceholder('键入关键字搜索文章...').fill(postTitle);
    await page.getByRole('button', { name: '搜索' }).click();
    await expect(page.getByRole('link', { name: postTitle })).toBeVisible();
  });

  test('admin edits post from detail page', async ({ page }) => {
    test.skip(!createdPostId, 'Post was not created');

    await loginViaUI(page, 'admin', '123456');
    await page.goto(`/posts/${createdPostId}`);
    await page.getByRole('link', { name: '编辑文章' }).click();
    await expect(page).toHaveURL(new RegExp(`/editor(\\?id=${createdPostId}|/${createdPostId})`));

    await page.getByPlaceholder('填写一个足够吸引读者的标题').fill(updatedTitle);
    await page.getByRole('button', { name: '修改并发布' }).click();
    await page.waitForURL(`/posts/${createdPostId}`);
    await expect(page.locator('#article-header h1')).toContainText(updatedTitle);
  });

  test('admin deletes post from detail page', async ({ page }) => {
    test.skip(!createdPostId, 'Post was not created');

    page.on('dialog', (dialog) => dialog.accept());

    await loginViaUI(page, 'admin', '123456');
    await page.goto(`/posts/${createdPostId}`);
    await page.getByRole('button', { name: '删除文章' }).click();

    await page.waitForURL('/');
    createdPostId = null;
  });
});

test.describe('Home — browse published posts', () => {
  let postId: number;
  let adminToken: string;
  const browseTitle = `Browse Test ${Date.now()}`;

  test.beforeAll(async () => {
    const auth = await apiLogin('admin', '123456');
    adminToken = auth.token;
    postId = await createPublishedPostViaApi(adminToken, browseTitle);
  });

  test.afterAll(async () => {
    await deletePostViaApi(adminToken, postId);
  });

  test('guest can view published post detail', async ({ page }) => {
    await page.goto(`/posts/${postId}`);
    await expect(page.locator('#article-header h1')).toContainText(browseTitle);
    await expect(page.getByText('前往登录')).toBeVisible();
  });

  test('guest navigates from home to detail', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: browseTitle }).click();
    await expect(page).toHaveURL(`/posts/${postId}`);
    await expect(page.locator('#article-header h1')).toContainText(browseTitle);
  });
});
