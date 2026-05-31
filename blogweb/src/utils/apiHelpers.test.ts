import { describe, expect, it } from 'vitest';
import { Post } from '../types';
import { normalizePost, parsePostsResponse, toWritePayload, canUserManagePost } from './apiHelpers';

describe('toWritePayload', () => {
  it('builds BlogApi create payload', () => {
    expect(
      toWritePayload({
        title: ' Hello ',
        content: 'body',
        categoryId: 2,
        tagIds: [1, 3],
        coverUrl: '/uploads/a.png',
      })
    ).toEqual({
      title: 'Hello',
      content: 'body',
      summary: undefined,
      categoryId: 2,
      tagIds: [1, 3],
      coverUrl: '/uploads/a.png',
    });
  });

  it('throws when category missing', () => {
    expect(() =>
      toWritePayload({ title: 't', content: 'c', categoryId: 0 })
    ).toThrow('请选择文章分类');
  });
});

describe('parsePostsResponse', () => {
  it('parses BlogApi PagedResult items', () => {
    const result = parsePostsResponse({
      items: [{ id: 1, title: 'A', content: 'x', status: 0 }],
      totalCount: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });

    expect(result.list).toHaveLength(1);
    expect(result.list[0].status).toBe('draft');
    expect(result.total).toBe(1);
  });
});

describe('normalizePost', () => {
  it('normalizes numeric status from API', () => {
    const post = normalizePost({
      id: 5,
      title: 't',
      content: 'c',
      status: 0,
      authorName: 'admin',
    });
    expect(post.status).toBe('draft');
  });

  it('maps category object and cover aliases', () => {
    const post = normalizePost({
      id: 1,
      title: 't',
      content: 'c',
      status: 1,
      coverImage: '/img.png',
      category: { id: 2, name: 'Tech' },
    });
    expect(post.coverUrl).toBe('/img.png');
    expect(post.categoryName).toBe('Tech');
    expect(post.status).toBe('published');
  });

  it('maps viewCount to views', () => {
    const post = normalizePost({
      id: 1,
      title: 't',
      content: 'c',
      status: 1,
      viewCount: 42,
    } as Post & { viewCount: number });
    expect(post.views).toBe(42);
    expect(post.readCount).toBe(42);
  });
});

describe('canUserManagePost', () => {
  it('allows author and admin only', () => {
    const post = { id: 1, title: 't', content: 'c', authorId: 2, authorName: 'alice' };
    expect(canUserManagePost(post, 2, false)).toBe(true);
    expect(canUserManagePost(post, 3, false)).toBe(false);
    expect(canUserManagePost(post, 3, true)).toBe(true);
  });
});

describe('getApiErrorFromBody', () => {
  it('prefers error field over message', async () => {
    const { getApiErrorFromBody } = await import('./apiHelpers');
    expect(getApiErrorFromBody({ error: 'bad', message: 'msg' }, 'fallback')).toBe('bad');
    expect(getApiErrorFromBody({ message: 'msg' }, 'fallback')).toBe('msg');
    expect(getApiErrorFromBody(undefined, 'fallback')).toBe('fallback');
  });
});
