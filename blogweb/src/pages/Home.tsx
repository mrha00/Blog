import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getPosts, getCategories, getTags, isDraftStatus, resolveAssetUrl } from '../api';
import { Post, Category, Tag } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatAuthorMeta } from '../utils/displayName';
import {
  filterBrowseCategories,
  filterBrowseTags,
  sortBrowseCategories,
  getCategoryAccent,
} from '../utils/catalogFilters';
import { Search, Calendar, Eye, Hash, LayoutGrid, FolderOpen, AlertCircle, PlusCircle, RefreshCw } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // State elements
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Filtering & Pagination via Query Params
  const searchWord = searchParams.get('q') || '';
  const activeCategory = searchParams.get('category') || '';
  const activeTag = searchParams.get('tag') || '';
  const page = Number(searchParams.get('page')) || 1;

  const [searchInput, setSearchInput] = useState(searchWord);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Load auxiliary lists (categories & tags)
  useEffect(() => {
    async function loadAuxData() {
      try {
        const [catsData, tagsData] = await Promise.all([
          getCategories(),
          getTags(),
        ]);
        setCategories(catsData);
        setTags(tagsData);
      } catch (err) {
        console.warn('Could not load categories or tags metadata', err);
      }
    }
    loadAuxData();
  }, []);

  // Fetch articles based on filter states
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setErrorStatus(null);
      try {
        const res = await getPosts({
          page,
          pageSize: 6,
          search: searchWord,
          categoryId: activeCategory,
          tagId: activeTag,
        });
        setPosts(res.list);
        setTotal(res.total);
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
  }, [page, searchWord, activeCategory, activeTag]);

  // Handle actions
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchParams.set('q', searchInput);
    searchParams.set('page', '1'); // reset to page 1
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

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    searchParams.set('page', String(newPage));
    setSearchParams(searchParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper selectors
  const hasActiveFilters = !!(searchWord || activeCategory || activeTag);

  const browseCategories = useMemo(
    () => sortBrowseCategories(filterBrowseCategories(categories)),
    [categories]
  );
  const browseTags = useMemo(() => filterBrowseTags(tags), [tags]);

  return (
    <div className="max-w-[800px] mx-auto px-6 py-8 flex-1 w-full">
      {/* Search Input Section */}
      <form onSubmit={handleSearchSubmit} className="mb-8">
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-500 transition-all">
          <div className="flex items-center pl-3 flex-1">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="键入关键字搜索文章..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full text-gray-700 placeholder-gray-400 bg-transparent py-2 px-1 focus:outline-none focus:ring-0 select-none"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-6 py-2 rounded-lg transition-colors cursor-pointer"
          >
            搜索
          </button>
        </div>
      </form>

      {/* Category filter */}
      {browseCategories.length > 0 && (
        <div className="mb-5 rounded-xl border border-gray-100 bg-gradient-to-b from-gray-50/90 to-white p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2.5 text-sm font-medium text-gray-700">
            <LayoutGrid className="w-4 h-4 text-gray-400" />
            <span>文章分类</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => selectCategory(null)}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === ''
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:text-blue-700 border border-gray-200 hover:border-blue-200'
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
                  className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    isActive
                      ? `${accent.bg} ${accent.text} ${accent.border} shadow-sm`
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tag filter */}
      {browseTags.length > 0 && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Hash className="w-4 h-4 text-gray-400" />
              <span>热门标签</span>
            </div>
            {activeTag && (
              <button
                onClick={() => selectTag(null)}
                className="text-xs text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
              >
                清除
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {browseTags.map((tag) => {
              const isActive = activeTag === String(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => selectTag(isActive ? null : tag.id)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-100'
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Clear Filter Display */}
      {hasActiveFilters && (
        <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-8 text-sm text-blue-800">
          <div className="flex items-center gap-2">
            <span>
              正在应用筛选：
              {searchWord && <span className="font-semibold">关键词 "{searchWord}"</span>}
              {activeCategory && (
                <span className="font-semibold">
                  {searchWord ? ' + ' : ''}分类 "
                  {categories.find((c) => String(c.id) === activeCategory)?.name || activeCategory}"
                </span>
              )}
              {activeTag && (
                <span className="font-semibold">
                  {(searchWord || activeCategory) ? ' + ' : ''}标签 "
                  {tags.find((t) => String(t.id) === activeTag)?.name || activeTag}"
                </span>
              )}
            </span>
          </div>
          <button
            onClick={clearAllFilters}
            className="text-xs text-blue-700 hover:text-blue-900 border border-blue-300 bg-white px-2.5 py-1 rounded-md font-semibold cursor-pointer shadow-sm"
          >
            清除所有筛选
          </button>
        </div>
      )}

      {/* Error Info Banner */}
      {errorStatus && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 mb-8 text-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-red-800 font-semibold text-base mb-1">接口调用失败</h3>
          <p className="text-red-600 text-sm max-w-[500px] mx-auto leading-relaxed">
            {errorStatus}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重新载入</span>
            </button>
            {user && (
              <Link
                to="/editor"
                className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>撰写离线文章</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Loading Ring */}
      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-200 border-t-blue-700"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 px-6 text-center shadow-sm">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-gray-900 font-bold text-lg mb-1">暂无文章 / 列表为空</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
            没有找到匹配当前筛选条件的内容。你可以尝试清除一些筛选器或添加新文章！
          </p>
          {user ? (
            <Link
              to="/editor"
              className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>发布第一篇文章</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm cursor-pointer transition-all"
            >
              <span>立即登录撰写文章</span>
            </Link>
          )}
        </div>
      ) : (
        /* Posts Listing */
        <div className="flex flex-col gap-6">
          {posts.map((post) => {
            const dateStr = post.createdAt || post.created_at || '';
            const formattedDate = dateStr
              ? new Date(dateStr).toISOString().split('T')[0]
              : '最近更新';
            
            // Extract cover
            const coverUrl = resolveAssetUrl(
              post.coverImage || post.cover || post.coverUrl
            );

            // Extract category string
            const categoryName =
              typeof post.category === 'object' && post.category
                ? post.category.name
                : typeof post.category === 'string'
                ? post.category
                : categories.find((c) => c.id === post.categoryId || c.id === post.category_id)?.name;

            // Check if published state
            const isDraft = isDraftStatus(post.status);

            return (
              <article
                key={post.id}
                id={`article-card-${post.id}`}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-6 items-start"
              >
                {/* Text Content Block */}
                <div className="flex-1 flex flex-col justify-between self-stretch">
                  <div>
                    {/* Header: Category and Draft status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded">
                        {categoryName || '其它杂谈'}
                      </span>
                      {isDraft && (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          草稿
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight hover:text-blue-700 transition-colors mb-2">
                      <Link to={`/posts/${post.id}`}>{post.title}</Link>
                    </h2>

                    {/* Excerpt Summary */}
                    <p className="text-gray-500 font-sans text-sm line-clamp-3 mb-4 leading-relaxed">
                      {post.summary || post.excerpt || post.content?.replace(/[#*`>_\-]/g, '').slice(0, 140) || '点击阅读全文...'}
                    </p>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center text-xs text-gray-500 gap-y-2 gap-x-4 border-t border-gray-100 pt-4 mt-auto">
                    <span className="text-gray-600">{formatAuthorMeta(post)}</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{formattedDate}</span>
                    </div>
                    {(post.views !== undefined || post.readCount !== undefined) && (
                      <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-gray-400" />
                        <span>{post.views !== undefined ? post.views : post.readCount} 次阅读</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Article Cover Image Thumbnail */}
                {coverUrl && (
                  <div className="w-full md:w-40 h-28 rounded-xl overflow-hidden bg-gray-50 border border-gray-150 flex-shrink-0 self-center">
                    <img
                      src={coverUrl}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination component */}
      {!loading && posts.length > 0 && totalPages > 1 && (
        <div id="posts-pagination" className="flex justify-between items-center mt-12 border-t border-gray-200 pt-6">
          <button
            onClick={() => changePage(page - 1)}
            disabled={page === 1}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
              page === 1
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-blue-700 border-gray-200 shadow-sm'
            }`}
          >
            上一页
          </button>
          
          <span className="text-sm font-semibold text-gray-600">
            第 {page} 页 / 共 {totalPages} 页
          </span>
          
          <button
            onClick={() => changePage(page + 1)}
            disabled={page === totalPages}
            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
              page === totalPages
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-blue-700 border-gray-200 shadow-sm'
            }`}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
