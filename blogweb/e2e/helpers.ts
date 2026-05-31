import type { Page } from '@playwright/test';

export const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:6133';

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<{ status: number; body: T }> {
  const res = await fetch(`${API_BASE}${path}`, options);
  const text = await res.text();
  let body: T;
  try {
    body = text ? JSON.parse(text) : (null as T);
  } catch {
    body = text as T;
  }
  return { status: res.status, body };
}

export async function apiLogin(username: string, password: string) {
  const { status, body } = await apiRequest<{ token: string; username: string; role: string }>(
    '/api/auth/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }
  );
  if (status !== 200 || !body.token) {
    throw new Error(`API login failed for ${username}: ${status}`);
  }
  return body;
}

export async function createPublishedPostViaApi(
  token: string,
  title: string,
  content = 'E2E test body'
) {
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const categories = await apiRequest<Array<{ id: number }>>('/api/categories');
  if (categories.status !== 200 || !categories.body.length) {
    throw new Error('No categories available for test post');
  }

  const create = await apiRequest<{ id: number }>('/api/posts', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      title,
      content,
      categoryId: categories.body[0].id,
      tagIds: [],
    }),
  });
  if (create.status !== 200 && create.status !== 201) {
    throw new Error(`Create post failed: ${create.status}`);
  }

  await apiRequest(`/api/posts/${create.body.id}/publish`, {
    method: 'POST',
    headers: auth,
  });

  return create.body.id;
}

export async function deletePostViaApi(token: string, postId: number) {
  const { status } = await apiRequest(`/api/posts/${postId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (status !== 204 && status !== 200) {
    throw new Error(`Delete post ${postId} failed: ${status}`);
  }
}

export async function addNestedCommentsViaApi(
  token: string,
  postId: number,
  rootText: string,
  replyText: string
) {
  const auth = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const root = await apiRequest<{ id: number }>(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ content: rootText, parentId: null }),
  });
  if (root.status !== 200 && root.status !== 201) {
    throw new Error(`Create root comment failed: ${root.status}`);
  }

  const reply = await apiRequest(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ content: replyText, parentId: root.body.id }),
  });
  if (reply.status !== 200 && reply.status !== 201) {
    throw new Error(`Create reply comment failed: ${reply.status}`);
  }
}

export async function loginViaUI(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.getByPlaceholder('键入用户名').fill(username);
  await page.getByPlaceholder('填写您的安全密码').fill(password);
  await page.getByRole('button', { name: '确定登录' }).click();
  await page.waitForURL('/');
  await page.getByRole('link', { name: '撰写' }).waitFor();
}

export async function logoutViaUI(page: Page) {
  await page.locator('#admin-dropdown-trigger').click();
  await page.getByRole('button', { name: '退出登录' }).click();
  await page.getByRole('link', { name: '登录' }).waitFor();
}

export async function openAdminMenu(page: Page) {
  await page.locator('#admin-dropdown-trigger').click();
  await page.locator('#admin-dropdown-menu').waitFor();
}
