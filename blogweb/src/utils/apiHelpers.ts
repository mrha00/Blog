import { Post, Category } from '../types';
import { normalizePostStatus } from './postStatus';

export interface PostWritePayload {
  title: string;
  content: string;
  summary?: string;
  categoryId: number;
  tagIds?: number[];
  coverUrl?: string;
}

function toStoredCoverUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const marker = '/uploads/';
  const idx = url.indexOf(marker);
  if (idx >= 0) {
    return url.slice(idx);
  }
  return url;
}

export function toWritePayload(postData: Partial<Post>): PostWritePayload {
  const categoryId = postData.categoryId ?? postData.category_id;
  if (categoryId === undefined || categoryId === null || Number(categoryId) <= 0) {
    throw new Error('请选择文章分类');
  }

  return {
    title: (postData.title || '').trim(),
    content: (postData.content || '').trim(),
    summary: postData.summary?.trim() || undefined,
    categoryId: Number(categoryId),
    tagIds: postData.tagIds || postData.tag_ids || [],
    coverUrl: toStoredCoverUrl(
      postData.coverUrl || postData.coverImage || postData.cover || undefined
    ),
  };
}

export function normalizePost(raw: Post): Post {
  const viewCount =
    raw.views ?? (raw as Post & { viewCount?: number }).viewCount ?? raw.readCount;

  return {
    ...raw,
    status: normalizePostStatus(raw.status),
    coverUrl: raw.coverUrl || raw.coverImage || raw.cover,
    authorName:
      raw.authorName ||
      (typeof raw.author === 'string' ? raw.author : undefined) ||
      (typeof raw.author === 'object' && raw.author ? raw.author.username : undefined),
    authorId: raw.authorId ?? raw.author_id,
    categoryName:
      raw.categoryName ||
      (typeof raw.category === 'string'
        ? raw.category
        : (raw.category as Category | undefined)?.name),
    views: viewCount,
    readCount: viewCount,
  };
}

export function getPostAuthorName(post: Post): string | undefined {
  if (post.authorName) return post.authorName;
  if (typeof post.author === 'string') return post.author;
  if (typeof post.author === 'object' && post.author) return post.author.username;
  return undefined;
}

export function canUserManagePost(
  post: Post,
  userId: number | undefined,
  isAdmin: boolean
): boolean {
  if (!userId) return false;
  if (isAdmin) return true;
  const authorId = post.authorId ?? post.author_id;
  return authorId !== undefined && authorId > 0 && authorId === userId;
}

export function parsePostsResponse(data: unknown, currentPage = 1) {
  if (Array.isArray(data)) {
    return {
      list: data.map((p) => normalizePost(p as Post)),
      total: data.length,
      page: 1,
      totalPages: 1,
    };
  }

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const list = (obj.items || obj.posts || obj.list || obj.data || obj.results || []) as Post[];
    const total = (obj.totalCount ?? obj.total ?? list.length) as number;
    const page = (obj.page ?? currentPage) as number;
    const pageSize = (obj.pageSize ?? 10) as number;
    const totalPages = (obj.totalPages as number) || Math.max(1, Math.ceil(total / pageSize));

    return {
      list: Array.isArray(list) ? list.map((p) => normalizePost(p)) : [],
      total,
      page,
      totalPages,
    };
  }

  return { list: [], total: 0, page: 1, totalPages: 1 };
}

export function getApiErrorFromBody(
  data: { error?: string; message?: string } | undefined,
  fallback: string
): string {
  return data?.error || data?.message || fallback;
}
