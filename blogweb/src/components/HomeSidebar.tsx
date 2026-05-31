import { Category, Tag } from '../types';
import { getCategoryAccent } from '../utils/catalogFilters';
import { Hash, Layers } from 'lucide-react';

interface HomeSidebarProps {
  categories: Category[];
  tags: Tag[];
  activeCategory: string;
  activeTag: string;
  onSelectCategory: (id: number | null) => void;
  onSelectTag: (id: number | null) => void;
}

export default function HomeSidebar({
  categories,
  tags,
  activeCategory,
  activeTag,
  onSelectCategory,
  onSelectTag,
}: HomeSidebarProps) {
  const topTags = tags.slice(0, 10);

  return (
    <aside className="flex flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
      {categories.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-slate-200">
            <Layers className="h-3.5 w-3.5 text-violet-600" />
            分类
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const accent = getCategoryAccent(cat.name);
              const isActive = activeCategory === String(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(isActive ? null : cat.id)}
                  title={cat.description}
                  className={`cursor-pointer rounded-md border px-2 py-1 text-[11px] font-semibold transition ${
                    isActive
                      ? `${accent.bg} ${accent.text} ${accent.border}`
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {topTags.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-slate-200">
              <Hash className="h-3.5 w-3.5 text-emerald-600" />
              标签
            </div>
            {activeTag && (
              <button
                type="button"
                onClick={() => onSelectTag(null)}
                className="cursor-pointer text-[10px] text-gray-400 hover:text-red-600"
              >
                清除
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {topTags.map((tag) => {
              const isActive = activeTag === String(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => onSelectTag(isActive ? null : tag.id)}
                  className={`cursor-pointer rounded px-2 py-0.5 text-[11px] transition ${
                    isActive
                      ? 'bg-blue-600 font-medium text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-950 dark:hover:text-blue-400'
                  }`}
                >
                  #{tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
