import { Comment } from '../types';

export function getCommentAuthorName(comment: Comment): string {
  return comment.userName || '热心读者';
}

export function normalizeComment(raw: Comment): Comment {
  return {
    ...raw,
    userName: raw.userName,
    userId: raw.userId,
    authorAvatarUrl: raw.authorAvatarUrl,
  };
}

/** Flatten API nested tree or pass-through flat list. */
export function flattenComments(list: Comment[]): Comment[] {
  const result: Comment[] = [];
  for (const item of list) {
    const { replies, ...rest } = item;
    result.push(normalizeComment(rest as Comment));
    if (replies?.length) {
      result.push(...flattenComments(replies));
    }
  }
  return result;
}

export function groupCommentsFromFlat(list: Comment[]): Comment[] {
  const map = new Map<number, Comment>();
  const roots: Comment[] = [];

  const cloned = list.map((item) => ({
    ...normalizeComment(item),
    replies: [] as Comment[],
  }));

  cloned.forEach((item) => map.set(item.id, item));

  cloned.forEach((item) => {
    if (item.parentId) {
      const parent = map.get(Number(item.parentId));
      if (parent) {
        parent.replies!.push(item);
      } else {
        roots.push(item);
      }
    } else {
      roots.push(item);
    }
  });

  return roots;
}

export function prepareComments(data: Comment[]): { flat: Comment[]; nested: Comment[] } {
  const flat = flattenComments(data);
  return { flat, nested: groupCommentsFromFlat(flat) };
}
