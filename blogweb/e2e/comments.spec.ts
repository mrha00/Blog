import { test, expect } from '@playwright/test';
import {
  apiLogin,
  addNestedCommentsViaApi,
  createPublishedPostViaApi,
  deletePostViaApi,
  loginViaUI,
} from './helpers';

test.describe.configure({ mode: 'serial' });

test.describe('Comments — create on detail page', () => {
  let postId: number;
  let adminToken: string;
  const commentText = `E2E comment ${Date.now()}`;

  test.beforeAll(async () => {
    const auth = await apiLogin('admin', '123456');
    adminToken = auth.token;
    postId = await createPublishedPostViaApi(adminToken, `Comment Test ${Date.now()}`);
  });

  test.afterAll(async () => {
    await deletePostViaApi(adminToken, postId);
  });

  test('logged-in user can post a comment', async ({ page }) => {
    await loginViaUI(page, 'alice', '123456');
    await page.goto(`/posts/${postId}`);

    await page
      .getByPlaceholder('写下你的想法…')
      .fill(commentText);
    await page.getByRole('button', { name: '发表评论' }).click();

    await expect(page.getByText(commentText)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#comments-section').getByText('爱丽丝')).toBeVisible();
  });

  test('nested reply survives page reload', async ({ page }) => {
    const replyText = `E2E reply ${Date.now()}`;

    await loginViaUI(page, 'admin', '123456');
    await page.goto(`/posts/${postId}`);

    await page.getByRole('button', { name: '回复' }).first().click();
    await page.getByPlaceholder(/回复 .+…/).fill(replyText);
    await page
      .locator('form')
      .filter({ has: page.getByPlaceholder(/回复 .+…/) })
      .getByRole('button', { name: '提交' })
      .click();

    await expect(page.getByText(replyText)).toBeVisible({ timeout: 10_000 });

    await page.reload();
    await expect(page.getByText(replyText)).toBeVisible({ timeout: 10_000 });
  });

  test('guest sees login prompt instead of comment form', async ({ page }) => {
    await page.goto(`/posts/${postId}`);
    await expect(page.getByText('登录后可参与讨论')).toBeVisible();
    await expect(page.getByRole('link', { name: '前往登录' })).toBeVisible();
  });
});

test.describe('Comments — delete post with nested replies', () => {
  test('API delete succeeds when post has nested comments', async () => {
    const auth = await apiLogin('admin', '123456');
    const nestedPostId = await createPublishedPostViaApi(
      auth.token,
      `Nested Delete ${Date.now()}`
    );
    await addNestedCommentsViaApi(
      auth.token,
      nestedPostId,
      `root-${Date.now()}`,
      `reply-${Date.now()}`
    );
    await deletePostViaApi(auth.token, nestedPostId);
  });
});
