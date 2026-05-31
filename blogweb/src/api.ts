import axios, { AxiosError } from 'axios';
import { Post, Category, Tag, Comment } from './types';
import {
  toWritePayload,
  normalizePost,
  parsePostsResponse,
  type PostWritePayload,
} from './utils/apiHelpers';
import { normalizeComment, flattenComments, groupCommentsFromFlat } from './utils/commentHelpers';
import { isDraftStatus, normalizePostStatus } from './utils/postStatus';
import { User } from './types';

export { isDraftStatus, normalizePostStatus, type PostWritePayload };

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6133';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function getApiError(error: unknown, fallback = '请求失败'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as {
      error?: string;
      message?: string;
      Message?: string;
    } | undefined;
    return data?.message || data?.Message || data?.error || error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export interface AuthResult {
  token: string;
  userId?: number;
  username: string;
  nickname?: string;
  role: string;
  avatarUrl?: string;
}

export async function loginUser(username: string, password: string): Promise<AuthResult> {
  const res = await api.post<AuthResult>('/api/auth/login', { username, password });
  return res.data;
}

export async function registerUser(
  username: string,
  email: string,
  password: string,
  nickname: string
): Promise<AuthResult> {
  const res = await api.post<AuthResult>('/api/auth/register', {
    username,
    email,
    password,
    nickname,
  });
  return res.data;
}

export async function getMe(): Promise<{
  userId: number;
  username: string;
  nickname?: string;
  role: string;
  avatarUrl?: string;
  email?: string;
  createdAt?: string;
}> {
  const res = await api.get('/api/auth/me');
  return res.data;
}

export async function updateProfile(payload: {
  nickname?: string;
  avatarUrl?: string;
}): Promise<{
  userId: number;
  username: string;
  nickname: string;
  role: string;
  avatarUrl?: string;
  email?: string;
}> {
  const res = await api.put('/api/auth/profile', payload);
  return res.data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.put('/api/auth/password', { currentPassword, newPassword });
}

export async function resolveSessionUser(token: string): Promise<User> {
  localStorage.setItem('token', token);
  const me = await getMe();
  return {
    id: Number(me.userId),
    username: me.username,
    nickname: me.nickname || me.username,
    avatarUrl: me.avatarUrl,
    email: me.email,
    role: me.role,
  };
}

export async function loginAndResolveUser(username: string, password: string): Promise<{
  token: string;
  user: User;
}> {
  const res = await loginUser(username, password);
  const user = await resolveSessionUser(res.token);
  return { token: res.token, user };
}

export async function registerAndResolveUser(
  username: string,
  email: string,
  password: string,
  nickname: string
): Promise<{ token: string; user: User }> {
  const res = await registerUser(username, email, password, nickname);
  const user = await resolveSessionUser(res.token);
  return { token: res.token, user };
}

export async function getPosts(filters: {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: number | string;
  tagId?: number | string;
}): Promise<{
  list: Post[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;

  const params: Record<string, string | number> = {
    page,
    pageSize,
  };

  if (filters.search) {
    params.keyword = filters.search;
  }
  if (filters.categoryId) {
    params.categoryId = Number(filters.categoryId);
  }
  if (filters.tagId) {
    params.tagId = Number(filters.tagId);
  }

  const res = await api.get('/api/posts', { params });
  return parsePostsResponse(res.data, page);
}

export async function getPostDetail(id: number | string): Promise<Post> {
  const res = await api.get(`/api/posts/${id}`);
  return normalizePost(res.data);
}

export async function createPost(postData: Partial<Post>): Promise<Post> {
  const payload = toWritePayload(postData);
  const res = await api.post('/api/posts', payload);
  return normalizePost(res.data);
}

export async function updatePost(id: number | string, postData: Partial<Post>): Promise<Post> {
  const payload = toWritePayload(postData);
  const res = await api.put(`/api/posts/${id}`, payload);
  return normalizePost(res.data);
}

export async function deletePost(id: number | string): Promise<void> {
  await api.delete(`/api/posts/${id}`);
}

export async function publishPost(id: number | string): Promise<Post> {
  const res = await api.post(`/api/posts/${id}/publish`);
  return normalizePost(res.data);
}

export async function draftPost(id: number | string): Promise<Post> {
  const res = await api.post(`/api/posts/${id}/draft`);
  return normalizePost(res.data);
}

export async function getCategories(): Promise<Category[]> {
  const res = await api.get<Category[]>('/api/categories');
  return Array.isArray(res.data) ? res.data : [];
}

export async function createCategory(name: string, description?: string): Promise<Category> {
  const res = await api.post<Category>('/api/categories', { name, description });
  return res.data;
}

export async function updateCategory(
  id: number,
  name: string,
  description?: string
): Promise<Category> {
  const res = await api.put<Category>(`/api/categories/${id}`, { name, description });
  return res.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/api/categories/${id}`);
}

export async function getTags(): Promise<Tag[]> {
  const res = await api.get<Tag[]>('/api/tags');
  return Array.isArray(res.data) ? res.data : [];
}

export async function createTag(name: string): Promise<Tag> {
  const res = await api.post<Tag>('/api/tags', { name });
  return res.data;
}

export async function getComments(postId: number | string): Promise<Comment[]> {
  const res = await api.get<Comment[]>(`/api/posts/${postId}/comments`);
  const data = Array.isArray(res.data) ? res.data : [];
  return flattenComments(data);
}

export async function getCommentsTree(postId: number | string): Promise<Comment[]> {
  const flat = await getComments(postId);
  return groupCommentsFromFlat(flat);
}

export async function createComment(
  postId: number | string,
  content: string,
  parentId: number | null = null
): Promise<Comment> {
  const res = await api.post<Comment>(`/api/posts/${postId}/comments`, {
    content,
    parentId,
  });
  return normalizeComment(res.data);
}

export async function deleteComment(id: number): Promise<void> {
  await api.delete(`/api/comments/${id}`);
}

export async function uploadCover(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const data = res.data as { data?: { url?: string }; url?: string };
  const url = data?.data?.url || data?.url;
  if (!url) {
    throw new Error('上传成功但未返回图片地址');
  }
  if (url.startsWith('http')) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }
  return url.startsWith('/') ? url : `/${url}`;
}

export function resolveAssetUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  const base = BASE_URL.replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

export async function getMyPosts(filters: {
  page?: number;
  pageSize?: number;
  search?: string;
} = {}): Promise<{
  list: Post[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const params: Record<string, string | number> = { page, pageSize };
  if (filters.search) {
    params.keyword = filters.search;
  }
  const res = await api.get('/api/posts/mine', { params });
  return parsePostsResponse(res.data, page);
}

export async function updateTag(id: number, name: string): Promise<Tag> {
  const res = await api.put<Tag>(`/api/tags/${id}`, { name });
  return res.data;
}

export async function deleteTag(id: number): Promise<void> {
  await api.delete(`/api/tags/${id}`);
}
