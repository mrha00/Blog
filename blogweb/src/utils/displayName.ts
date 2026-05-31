import { Post, User } from '../types';

export function getDisplayName(
  source?: Pick<User, 'nickname' | 'username'> | { authorName?: string; nickname?: string; username?: string } | null
): string {
  if (!source) return '匿名用户';
  const nickname =
    'nickname' in source && source.nickname
      ? source.nickname
      : 'authorName' in source
        ? source.authorName
        : undefined;
  const username = 'username' in source ? source.username : undefined;
  return nickname?.trim() || username?.trim() || '匿名用户';
}

export function getPostAuthorLabel(post: Post): string {
  return getDisplayName({
    authorName: post.authorName,
    username: typeof post.author === 'string' ? post.author : post.author?.username,
    nickname:
      typeof post.author === 'object' && post.author && 'nickname' in post.author
        ? (post.author as User).nickname
        : undefined,
  });
}

export function formatAuthorMeta(post: Post): string {
  return `作者 · ${getPostAuthorLabel(post)}`;
}
