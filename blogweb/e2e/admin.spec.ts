import { test, expect } from '@playwright/test';
import { apiLogin, apiRequest, loginViaUI, openAdminMenu } from './helpers';

test.describe('Admin — categories & tags management', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, 'admin', '123456');
  });

  test.afterEach(async ({ page }) => {
    await page.goto('/');
  });

  test('admin creates a new tag', async ({ page }) => {
    const tagName = `e2e-tag-${Date.now()}`;

    await page.goto('/tags');
    await expect(page.getByTestId('tag-name-input')).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('tag-name-input').fill(tagName);
    await page.getByRole('button', { name: '添加' }).click();
    await expect(page.getByText(tagName)).toBeVisible({ timeout: 10_000 });
  });

  test('admin creates and updates a category', async ({ page }) => {
    const catName = `E2E-Cat-${Date.now()}`;
    const updatedName = `${catName}-updated`;

    await openAdminMenu(page);
    await page.getByRole('link', { name: '分类管理' }).click();
    await expect(page.getByRole('heading', { name: '分类管理' })).toBeVisible();

    await page.getByPlaceholder('如: 网络工程、个人感悟').fill(catName);
    await page.getByPlaceholder('填写简要的分类详情与涵盖领域').fill('E2E test category');
    await page.getByRole('button', { name: '创建分类' }).click();
    await expect(page.getByText(catName)).toBeVisible({ timeout: 10_000 });

    const row = page.locator('#categories-admin-table tr', { hasText: catName });
    await row.getByTitle('编辑').click();
    await page.getByPlaceholder('如: 网络工程、个人感悟').fill(updatedName);
    await page.getByRole('button', { name: '保存更改' }).click();
    await expect(page.getByText(updatedName)).toBeVisible();

    page.on('dialog', (dialog) => dialog.accept());
    await page.locator('#categories-admin-table tr', { hasText: updatedName }).getByTitle('删除').click();
    await expect(page.getByText(updatedName)).not.toBeVisible({ timeout: 10_000 });
  });

  test('admin navigates via header dropdown', async ({ page }) => {
    await openAdminMenu(page);
    await expect(page.getByRole('link', { name: '分类管理' })).toBeVisible();
    await expect(page.getByRole('link', { name: '标签管理' })).toBeVisible();
    await expect(page.getByRole('button', { name: '退出登录' })).toBeVisible();
  });
});

test.describe('Editor — draft mode', () => {
  let adminToken: string;
  let draftPostId: number | null = null;

  test.beforeAll(async () => {
    const auth = await apiLogin('admin', '123456');
    adminToken = auth.token;
  });

  test.afterAll(async () => {
    if (draftPostId) {
      await apiRequest(`/api/posts/${draftPostId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
  });

  test('admin saves post as draft', async ({ page }) => {
    const draftTitle = `E2E Draft ${Date.now()}`;

    await loginViaUI(page, 'admin', '123456');
    await page.goto('/editor');

    await page.getByPlaceholder('填写一个足够吸引读者的标题').fill(draftTitle);
    await page.locator('select').selectOption({ index: 1 });
    await page.getByPlaceholder(/键入您的文章内容/).fill('Draft content for E2E test.');
    await page.getByRole('button', { name: '存为私人草稿' }).click();
    await page.getByRole('button', { name: '确定提交' }).click();

    await page.waitForURL(/\/posts\/\d+$/);
    await expect(page.getByText('该文章目前处于草稿编辑状态，仅作为您的个人存储。')).toBeVisible();

    const match = page.url().match(/\/posts\/(\d+)/);
    draftPostId = match ? Number(match[1]) : null;
  });
});
