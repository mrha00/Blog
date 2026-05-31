import { describe, expect, it } from 'vitest';
import { isTestCatalogName } from './catalogFilters';

describe('isTestCatalogName', () => {
  it('flags integration and e2e catalog names', () => {
    expect(isTestCatalogName('e2e-cat-1')).toBe(true);
    expect(isTestCatalogName('int-tag-abc')).toBe(true);
    expect(isTestCatalogName('TechCat42')).toBe(true);
  });

  it('allows standard production categories', () => {
    expect(isTestCatalogName('技术分享')).toBe(false);
    expect(isTestCatalogName('生活随笔')).toBe(false);
  });
});
