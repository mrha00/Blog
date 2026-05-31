import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Hash,
  PenLine,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { getUserProfile, getUserPosts, getApiError } from '../api';
import { PublicUserProfile, Post } from '../types';
import UserAvatar from '../components/UserAvatar';
import PostCard from '../components/PostCard';
import { getPostCategoryName } from '../utils/apiHelpers';
import { getDisplayName } from '../utils/displayName';
import { useAuth } from '../context/AuthContext';
import { getCategoryAccent } from '../utils/catalogFilters';

function collectAuthorTags(posts: Post[]): string[] {
  const set = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags ?? []) {
      const name = typeof tag === 'string' ? tag : (tag as { name?: string }).name;
      if (name) set.add(name);
    }
  }
  return Array.from(set).slice(0, 12);
}

function daysSince(dateStr?: string) {
  if (!dateStr) return null;
  const joined = new Date(dateStr);
  const now = new Date();
  return Math.max(1, Math.floor((now.getTime() - joined.getTime()) / 86400000));
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const userId = Number(id);

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || Number.isNaN(userId)) {
      setError('无效的用户');
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [profileData, postsData] = await Promise.all([
          getUserProfile(userId),
          getUserPosts(userId, page, 10),
        ]);
        setProfile(profileData);
        setPosts(postsData.list);
        setTotal(postsData.total);
        setTotalPages(postsData.totalPages);
      } catch (err: unknown) {
        setError(getApiError(err, '用户不存在或无法加载'));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId, page]);

  const authorTags = useMemo(() => collectAuthorTags(posts), [posts]);
  const showFeatured = page === 1 && posts.length > 0;
  const featuredPosts = useMemo(
    () => (showFeatured ? posts.slice(0, 3) : []),
    [posts, showFeatured]
  );
  const listPosts = useMemo(() => {
    if (page !== 1) return posts;
    return posts.length > 3 ? posts.slice(3) : [];
  }, [posts, page]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const post of posts) {
      const name = getPostCategoryName(post) || '其它';
      map.set(name, (map.get(name) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [posts]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl flex-1 items-center justify-center px-6 py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-200 border-t-blue-700 dark:border-slate-600 dark:border-t-blue-400" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-5xl flex-1 px-6 py-16 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{error || '用户不存在'}</p>
        <Link to="/" className="mt-4 inline-block text-sm text-blue-700 hover:underline dark:text-blue-400">
          返回首页
        </Link>
      </div>
    );
  }

  const displayName = getDisplayName(profile);
  const joinedAt = profile.createdAt
    ? new Date(profile.createdAt).toISOString().split('T')[0]
    : '';
  const memberDays = daysSince(profile.createdAt);
  const isSelf = currentUser?.id === profile.id;
  const bioText = profile.bio?.trim() || '';

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
      <Link
        to="/"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" />
        返回首页
      </Link>

      <section className="relative mb-6 overflow-hidden rounded-2xl border border-stone-200/80 bg-gradient-to-br from-stone-800 via-stone-700 to-amber-900/90 px-6 py-8 text-white shadow-lg dark:border-slate-700 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-amber-400/20 blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-6 left-1/3 h-32 w-32 rounded-full bg-emerald-400/15 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end">
          <div className="rounded-full ring-4 ring-white/20">
            <UserAvatar user={profile} size="lg" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              作者主页
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{displayName}</h1>
            <p className="mt-1 text-sm text-stone-200">@{profile.username}</p>
            {isSelf && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-stone-800 shadow-sm hover:bg-stone-50"
                >
                  <PenLine className="h-3.5 w-3.5" />
                  编辑资料
                </Link>
                <Link
                  to="/editor"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3.5 py-2 text-xs font-semibold backdrop-blur-sm hover:bg-white/20"
                >
                  写新文章
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: '公开文章', value: profile.publishedPostCount, icon: FileText },
            { label: '常用标签', value: authorTags.length, icon: Hash },
            { label: '活跃分类', value: categoryBreakdown.length, icon: Sparkles },
            {
              label: memberDays ? '入驻天数' : '加入时间',
              value: memberDays ? `${memberDays} 天` : joinedAt || '—',
              icon: Calendar,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-sm"
            >
              <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-stone-300">
                <Icon className="h-3 w-3" />
                {label}
              </div>
              <p className="mt-0.5 text-lg font-bold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-stone-200/80 bg-[var(--card-bg)] p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-slate-500">
              <UserRound className="h-3.5 w-3.5" />
              个人简介
            </div>
            {bioText ? (
              <p className="select-text whitespace-pre-wrap text-sm leading-relaxed text-stone-700 dark:text-slate-300">
                {bioText}
              </p>
            ) : (
              <p className="text-sm leading-relaxed text-stone-400 dark:text-slate-500">
                {isSelf ? (
                  <>
                    还没有填写简介。
                    <Link
                      to="/settings"
                      className="ml-1 font-semibold text-blue-700 hover:underline dark:text-blue-400"
                    >
                      去设置页完善
                    </Link>
                  </>
                ) : (
                  '这位作者还没有填写个人简介'
                )}
              </p>
            )}
          </div>

          {authorTags.length > 0 && (
            <div className="rounded-2xl border border-stone-200/80 bg-[var(--card-bg)] p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-slate-500">
                写作标签
              </h3>
              <div className="flex flex-wrap gap-2">
                {authorTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {categoryBreakdown.length > 0 && (
            <div className="rounded-2xl border border-stone-200/80 bg-[var(--card-bg)] p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-slate-500">
                发文分类
              </h3>
              <ul className="space-y-2">
                {categoryBreakdown.map(([name, count]) => {
                  const accent = getCategoryAccent(name);
                  return (
                    <li key={name} className="flex items-center justify-between text-sm">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${accent.bg} ${accent.text}`}>
                        {name}
                      </span>
                      <span className="text-xs tabular-nums text-stone-400 dark:text-slate-500">{count} 篇</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>

        <div>
          {showFeatured && (
            <div className="mb-6">
              <h2 className="mb-3 text-sm font-bold text-stone-900 dark:text-slate-100">精选文章</h2>
              <div className="flex flex-col gap-2">
                {featuredPosts.map((post) => (
                  <PostCard key={`feat-${post.id}`} post={post} categoryName={getPostCategoryName(post)} />
                ))}
              </div>
              {listPosts.length > 0 && (
                <p className="mt-2 text-center text-[11px] text-stone-400 dark:text-slate-500">
                  以下为更多公开文章
                </p>
              )}
            </div>
          )}

          {(listPosts.length > 0 || !showFeatured) && (
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-900 dark:text-slate-100">
                {showFeatured && listPosts.length > 0 ? '更多文章' : '已发布文章'}
              </h2>
              <span className="text-xs text-stone-500 dark:text-slate-400">共 {total} 篇</span>
            </div>
          )}

          {posts.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-[var(--card-bg)] py-16 text-center dark:border-slate-700 dark:bg-slate-900">
              <FileText className="mx-auto mb-3 h-10 w-10 text-stone-300 dark:text-slate-600" />
              <p className="text-sm text-stone-400 dark:text-slate-500">该用户还没有公开发布的文章</p>
              {isSelf && (
                <Link
                  to="/editor"
                  className="mt-3 inline-block text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
                >
                  去写一篇 →
                </Link>
              )}
            </div>
          ) : listPosts.length > 0 ? (
            <div className="flex flex-col gap-2">
              {listPosts.map((post) => (
                <PostCard key={post.id} post={post} categoryName={getPostCategoryName(post)} />
              ))}
            </div>
          ) : null}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between border-t border-stone-200 pt-4 dark:border-slate-700">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="cursor-pointer rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
              >
                上一页
              </button>
              <span className="text-xs text-stone-500 dark:text-slate-400">
                第 {page} / {totalPages} 页
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="cursor-pointer rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
