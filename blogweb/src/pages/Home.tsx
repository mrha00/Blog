import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { getPosts, getMyPosts, getCategories, getTags } from '../api';
import { Post, Category, Tag } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  filterBrowseCategories,
  filterBrowseTags,
  sortBrowseCategories,
  getCategoryAccent,
} from '../utils/catalogFilters';
import { Search, Hash, LayoutGrid, FolderOpen, AlertCircle, PlusCircle, FileText } from 'lucide-react';
import PostCard from '../components/PostCard';
import HomeHero from '../components/HomeHero';
import HomeSidebar from '../components/HomeSidebar';
import HorizontalScrollRow from '../components/HorizontalScrollRow';
import { getPostCategoryName } from '../utils/apiHelpers';

gsap.registerPlugin(useGSAP);

export default function Home() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const searchWord = searchParams.get('q') || '';
  const activeCategory = searchParams.get('category') || '';
  const activeTag = searchParams.get('tag') || '';
  const page = Number(searchParams.get('page')) || 1;

  const [searchInput, setSearchInput] = useState(searchWord);
  const [totalArticles, setTotalArticles] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [browseMode, setBrowseMode] = useState<'all' | 'mine'>('all');
  const postListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadAuxData() {
      try {
        const [catsData, tagsData] = await Promise.all([getCategories(), getTags()]);
        setCategories(catsData);
        setTags(tagsData);
      } catch (err) {
        console.warn('Could not load categories or tags metadata', err);
      }
    }
    loadAuxData();
  }, []);

  useEffect(() => {
    if (browseMode === 'mine' && !user) {
      setBrowseMode('all');
      return;
    }

    const fetchArticles = async () => {
      setLoading(true);
      setErrorStatus(null);
      try {
        const fetcher = browseMode === 'mine' ? getMyPosts : getPosts;
        const res = await fetcher({
          page,
          pageSize: 10,
          search: searchWord,
          ...(browseMode === 'all' ? { categoryId: activeCategory, tagId: activeTag } : {}),
        });
        setPosts(res.list);
        setTotalArticles(res.total);
        setTotalPages(res.totalPages);
      } catch (err: any) {
        console.error('Fetch post error:', err);
        setErrorStatus(
          err.message || '连接 BlogApi 时遇到了错误。请确保后端已经运行在 http://localhost:6133'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [page, searchWord, activeCategory, activeTag, browseMode, user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchParams.set('q', searchInput);
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const selectCategory = (catId: number | string | null) => {
    if (catId === null) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', String(catId));
    }
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const selectTag = (tagId: number | string | null) => {
    if (tagId === null) {
      searchParams.delete('tag');
    } else {
      searchParams.set('tag', String(tagId));
    }
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    searchParams.set('page', String(newPage));
    setSearchParams(searchParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters = !!(searchWord || activeCategory || activeTag);

  const browseCategories = useMemo(
    () => sortBrowseCategories(filterBrowseCategories(categories)),
    [categories]
  );
  const browseTags = useMemo(() => filterBrowseTags(tags), [tags]);

  useGSAP(
    () => {
      if (loading || posts.length === 0) return;
      const cards = postListRef.current?.querySelectorAll('[data-post-card]');
      if (!cards?.length) return;
      gsap.fromTo(
        cards,
        { opacity: 0, y: 8 },
        {
          opacity: 1,
          y: 0,
          duration: 0.38,
          stagger: 0.05,
          ease: 'power2.out',
          clearProps: 'transform',
        }
      );
    },
    { dependencies: [posts, loading], scope: postListRef }
  );

  const showHero = browseMode === 'all' && !hasActiveFilters && page === 1;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      {showHero && (
        <HomeHero
          totalArticles={totalArticles}
          categoryCount={browseCategories.length}
          tagCount={browseTags.length}
        />
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <form onSubmit={handleSearchSubmit} className="mb-6">
            <div className="mb-6 flex gap-2 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:border-blue-600 dark:focus-within:ring-blue-900/50">
              <div className="flex flex-1 items-center pl-3">
                <Search className="mr-2 h-5 w-5 text-gray-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="搜索文章标题、摘要或关键词…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-transparent py-2.5 text-gray-700 placeholder-gray-400 focus:outline-none dark:text-slate-200 dark:placeholder-slate-500"
                />
              </div>
              <button
                type="submit"
                className="cursor-pointer rounded-xl bg-blue-700 px-6 py-2.5 font-medium text-white transition hover:bg-blue-800"
              >
                搜索
              </button>
            </div>
          </form>

          {user && (
            <div className="mb-6 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setBrowseMode('all');
                  searchParams.set('page', '1');
                  setSearchParams(searchParams);
                }}
                className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  browseMode === 'all'
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-blue-200'
                }`}
              >
                全部文章
              </button>
              <button
                type="button"
                onClick={() => {
                  setBrowseMode('mine');
                  searchParams.set('page', '1');
                  setSearchParams(searchParams);
                }}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  browseMode === 'mine'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-amber-200'
                }`}
              >
                <FileText className="h-4 w-4" />
                我的草稿
              </button>
            </div>
          )}

          {browseMode === 'all' && browseCategories.length > 0 && (
            <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:hidden">
              <div className="mb-2.5 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-200">
                <LayoutGrid className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                <span>文章分类</span>
              </div>
              <HorizontalScrollRow className="px-0.5 md:px-8">
                <button
                  onClick={() => selectCategory(null)}
                  className={`shrink-0 cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    activeCategory === ''
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'border border-gray-200 bg-gray-50 text-gray-600 hover:border-blue-200'
                  }`}
                >
                  全部
                </button>
                {browseCategories.map((cat) => {
                  const accent = getCategoryAccent(cat.name);
                  const isActive = activeCategory === String(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => selectCategory(cat.id)}
                      title={cat.description}
                      className={`shrink-0 cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition ${
                        isActive
                          ? `${accent.bg} ${accent.text} ${accent.border} shadow-sm`
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </HorizontalScrollRow>
            </div>
          )}

          {browseMode === 'all' && browseTags.length > 0 && (
            <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:hidden">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <Hash className="h-4 w-4 text-gray-400" />
                  <span>热门标签</span>
                </div>
                {activeTag && (
                  <button
                    onClick={() => selectTag(null)}
                    className="cursor-pointer text-xs text-gray-500 transition hover:text-red-600"
                  >
                    清除
                  </button>
                )}
              </div>
              <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                {browseTags.map((tag) => {
                  const isActive = activeTag === String(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => selectTag(isActive ? null : tag.id)}
                      className={`cursor-pointer rounded-md px-2.5 py-1 text-xs transition ${
                        isActive
                          ? 'bg-blue-600 font-medium text-white'
                          : 'border border-transparent bg-gray-50 text-gray-600 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {errorStatus && (
            <div className="mb-8 rounded-2xl border border-red-100 bg-red-50 p-6 text-center shadow-sm">
              <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
              <h3 className="mb-1 text-base font-semibold text-red-800">接口调用失败</h3>
              <p className="mx-auto max-w-[500px] text-sm leading-relaxed text-red-600">{errorStatus}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-200 border-t-blue-700" />
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
              <FolderOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <h3 className="mb-1 text-lg font-bold text-gray-900">
                {browseMode === 'mine' ? '暂无草稿 / 我的文章' : '暂无匹配文章'}
              </h3>
              <p className="mx-auto mb-6 max-w-sm text-sm text-gray-500">
                {browseMode === 'mine'
                  ? '你还没有保存任何草稿或文章，去编辑器写一篇吧。'
                  : '试试清除筛选条件，或发布第一篇文章。'}
              </p>
              {user ? (
                <Link
                  to="/editor"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
                >
                  <PlusCircle className="h-4 w-4" />
                  发布第一篇文章
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
                >
                  立即登录撰写
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-gray-900 dark:text-slate-100">
                  {browseMode === 'mine' ? '我的文章' : '最新文章'}
                </h2>
                <span className="text-xs text-gray-500 dark:text-slate-400">共 {totalArticles} 篇</span>
              </div>
              <div ref={postListRef} className="flex flex-col gap-2">
              {posts.map((post) => (
                  <div key={post.id} data-post-card>
                    <PostCard
                      post={post}
                      categoryName={getPostCategoryName(post, categories)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && posts.length > 0 && totalPages > 1 && (
            <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-6">
              <button
                onClick={() => changePage(page - 1)}
                disabled={page === 1}
                className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  page === 1
                    ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                    : 'border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:text-blue-700'
                }`}
              >
                上一页
              </button>
              <span className="text-sm font-semibold text-gray-600">
                第 {page} / {totalPages} 页
              </span>
              <button
                onClick={() => changePage(page + 1)}
                disabled={page === totalPages}
                className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  page === totalPages
                    ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                    : 'border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:text-blue-700'
                }`}
              >
                下一页
              </button>
            </div>
          )}
        </div>

        {browseMode === 'all' && (
          <HomeSidebar
            categories={browseCategories}
            tags={browseTags}
            activeCategory={activeCategory}
            activeTag={activeTag}
            onSelectCategory={selectCategory}
            onSelectTag={selectTag}
          />
        )}
      </div>
    </div>
  );
}
