import { Category, Tag } from '../types';

const TEST_CATALOG_PATTERN =
  /^(e2e|int)[-_]|^TechCat\d*$|^UniqueTag|^int-cat-|^int-tag-|^e2e-tag-|^e2e-cat-/i;

const STANDARD_CATEGORY_ORDER = [
  '技术分享',
  '产品与设计',
  '学习笔记',
  '生活随笔',
  '问答讨论',
];

export function isTestCatalogName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed || /^[\?]+$/.test(trimmed)) return true;
  return TEST_CATALOG_PATTERN.test(trimmed);
}

export function filterBrowseCategories(categories: Category[]): Category[] {
  return categories.filter((c) => !isTestCatalogName(c.name));
}

export function filterBrowseTags(tags: Tag[]): Tag[] {
  return tags.filter((t) => !isTestCatalogName(t.name));
}

export function sortBrowseCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => {
    const ai = STANDARD_CATEGORY_ORDER.indexOf(a.name);
    const bi = STANDARD_CATEGORY_ORDER.indexOf(b.name);
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name, 'zh-CN');
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export function getCategoryAccent(name: string): { bg: string; text: string; border: string } {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    技术分享: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    '产品与设计': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    学习笔记: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    生活随笔: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    问答讨论: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  };
  return map[name] ?? { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
}
