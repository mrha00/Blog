import { Link } from 'react-router-dom';
import { Calendar, Eye } from 'lucide-react';
import { Post } from '../types';
import { isDraftStatus, resolveAssetUrl } from '../api';
import { formatAuthorMeta } from '../utils/displayName';

export interface PostCardProps {
  post: Post;
  categoryName?: string;
}

export default function PostCard({ post, categoryName }: PostCardProps) {
  const dateStr = post.createdAt || '';
  const formattedDate = dateStr
    ? new Date(dateStr).toISOString().split('T')[0]
    : '最近更新';

  const coverUrl = resolveAssetUrl(post.coverUrl);
  const isDraft = isDraftStatus(post.status);
  const viewCount = post.views ?? post.readCount;

  return (
    <article
      id={`article-card-${post.id}`}
      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-6 items-start"
    >
      <div className="flex-1 flex flex-col justify-between self-stretch">
        <div>
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

          <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight hover:text-blue-700 transition-colors mb-2">
            <Link to={`/posts/${post.id}`}>{post.title}</Link>
          </h2>

          <p className="text-gray-500 font-sans text-sm line-clamp-3 mb-4 leading-relaxed">
            {post.summary || post.content?.replace(/[#*`>_\-]/g, '').slice(0, 140) || '点击阅读全文...'}
          </p>
        </div>

        <div className="flex flex-wrap items-center text-xs text-gray-500 gap-y-2 gap-x-4 border-t border-gray-100 pt-4 mt-auto">
          <span className="text-gray-600">{formatAuthorMeta(post)}</span>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{formattedDate}</span>
          </div>
          {viewCount !== undefined && (
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-gray-400" />
              <span>{viewCount} 次阅读</span>
            </div>
          )}
        </div>
      </div>

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
}
