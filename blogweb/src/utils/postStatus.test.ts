import { describe, expect, it } from 'vitest';
import { isDraftStatus, normalizePostStatus } from './postStatus';

describe('postStatus', () => {
  it('treats numeric 0 as draft', () => {
    expect(isDraftStatus(0)).toBe(true);
    expect(normalizePostStatus(0)).toBe('draft');
  });

  it('treats numeric 1 as published', () => {
    expect(isDraftStatus(1)).toBe(false);
    expect(normalizePostStatus(1)).toBe('published');
  });

  it('treats string Draft/draft as draft', () => {
    expect(isDraftStatus('Draft')).toBe(true);
    expect(isDraftStatus('draft')).toBe(true);
  });

  it('treats string Published as published', () => {
    expect(isDraftStatus('Published')).toBe(false);
    expect(normalizePostStatus('Published')).toBe('published');
  });

  it('handles undefined safely', () => {
    expect(isDraftStatus(undefined)).toBe(false);
    expect(normalizePostStatus(undefined)).toBe('published');
  });
});
