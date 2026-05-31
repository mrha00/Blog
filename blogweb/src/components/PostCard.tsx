import { Link, useNavigate } from 'react-router-dom';
import { shouldSkipCardNavigation } from '../utils/navigateUnlessSelecting';
import { Calendar, Eye, ImageOff } from 'lucide-react';
import { Post } from '../types';
import { isDraftStatus, resolveAssetUrl } from '../api';
import { getPostAuthorLabel } from '../utils/displayName';
import { getCategoryAccent } from '../utils/catalogFilters';
import UserLink from './UserLink';

export interface PostCardProps {
  post: Post;
  categoryName?: string;
}

export default function PostCard({ post, categoryName }: PostCardProps) {
  const navigate = useNavigate();
  const dateStr = post.createdAt || '';
  const formattedDate = dateStr
    ? new Date(dateStr).toISOString().split('T')[0]
    : '最近更新';

  const coverUrl = resolveAssetUrl(post.coverUrl);
  const isDraft = isDraftStatus(post.status);
  const viewCount = post.views ?? post.readCount;
  const label = categoryName || '其它杂谈';
  const accent = getCategoryAccent(label);
  const excerpt =
    post.summary || post.content?.replace(/[#*`>_-]/g, '').slice(0, 120) || '点击阅读全文…';
  const href = `/posts/${post.id}`;
  const authorLabel = getPostAuthorLabel(post);

  return (
    <article
      id={`article-card-${post.id}`}
      role="link"
      tabIndex={0}
      onClick={(e) => {
        if (!shouldSkipCardNavigation(e)) navigate(href);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(href);
      }}
      className="group relative flex cursor-pointer gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-800 dark:hover:bg-slate-800/80"
    >

      <div className="relative z-[1] h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 dark:border-slate-700 dark:bg-slate-800">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff className="h-5 w-5 text-gray-300 dark:text-slate-600" />
          </div>
        )}
      </div>

      <div className="relative min-w-0 flex-1 select-text">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${accent.bg} ${accent.text}`}
          >
            {label}
          </span>
          {isDraft && (
            <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400">
              草稿
            </span>
          )}
        </div>

        <h2 className="truncate text-sm font-bold text-gray-900 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-400">
          <Link to={href} className="hover:underline" onClick={(e) => e.stopPropagation()}>
            {post.title}
          </Link>
        </h2>

        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-slate-400">
          {excerpt}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-400 dark:text-slate-500">
          <span className="text-gray-600 dark:text-slate-300">
            作者 ·{' '}
            <UserLink
              userId={post.authorId}
              name={authorLabel}
              className="text-[11px] font-normal"
              stopPropagation
            />
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </span>
          {viewCount !== undefined && (
            <span className="inline-flex items-center gap-0.5">
              <Eye className="h-3 w-3" />
              {viewCount}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
