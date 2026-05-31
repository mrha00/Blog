/** BlogApi PostStatus: Draft=0, Published=1 (may arrive as number or string) */
export type PostStatusInput = string | number | null | undefined;

export function normalizePostStatus(status: PostStatusInput): 'draft' | 'published' {
  if (status === 0 || status === '0') {
    return 'draft';
  }
  if (status === 1 || status === '1') {
    return 'published';
  }
  if (typeof status === 'string') {
    return status.toLowerCase() === 'draft' ? 'draft' : 'published';
  }
  return 'published';
}

export function isDraftStatus(status: PostStatusInput): boolean {
  return normalizePostStatus(status) === 'draft';
}
