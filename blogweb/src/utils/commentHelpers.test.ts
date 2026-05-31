import { describe, expect, it } from 'vitest';
import {
  flattenComments,
  getCommentAuthorName,
  groupCommentsFromFlat,
  normalizeComment,
} from './commentHelpers';

describe('normalizeComment', () => {
  it('maps userName from BlogApi', () => {
    const c = normalizeComment({ id: 1, content: 'hi', userName: 'alice' });
    expect(c.userName).toBe('alice');
    expect(getCommentAuthorName(c)).toBe('alice');
  });
});

describe('flattenComments', () => {
  it('flattens nested API tree without losing replies', () => {
    const flat = flattenComments([
      {
        id: 1,
        content: 'root',
        replies: [{ id: 2, content: 'child', parentId: 1, userName: 'bob' }],
      },
    ]);
    expect(flat).toHaveLength(2);
    expect(flat[1].userName).toBe('bob');
  });
});

describe('groupCommentsFromFlat', () => {
  it('rebuilds tree after flattening', () => {
    const nested = groupCommentsFromFlat([
      { id: 1, content: 'root' },
      { id: 2, content: 'child', parentId: 1, userName: 'bob' },
    ]);
    expect(nested).toHaveLength(1);
    expect(nested[0].replies).toHaveLength(1);
    expect(nested[0].replies![0].content).toBe('child');
  });

  it('round-trips API-shaped nested data', () => {
    const apiTree = [
      {
        id: 10,
        content: 'parent',
        userName: 'admin',
        replies: [{ id: 11, content: 'reply', parentId: 10, userName: 'alice' }],
      },
    ];
    const flat = flattenComments(apiTree);
    const nested = groupCommentsFromFlat(flat);
    expect(nested[0].replies![0].userName).toBe('alice');
  });
});
