import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  getPostDetail,
  deletePost,
  publishPost,
  draftPost,
  getComments,
  createComment,
  deleteComment,
  getCategories,
  getApiError,
  resolveAssetUrl,
  isDraftStatus,
} from '../api';
import { Post, Comment, Category } from '../types';
import { useAuth } from '../context/AuthContext';
import { canUserManagePost } from '../utils/apiHelpers';
import { getCommentAuthorName, groupCommentsFromFlat } from '../utils/commentHelpers';
import { formatAuthorMeta } from '../utils/displayName';
import UserAvatar from '../components/UserAvatar';
import {
  Calendar,
  Eye,
  MessageSquare,
  ArrowLeft,
  Edit,
  Trash2,
  Lock,
  Globe,
  AlertCircle,
  FolderOpen
} from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  // States of Detail Page
  const [post, setPost] = useState<Post | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatComments, setFlatComments] = useState<Comment[]>([]);
  const [nestedComments, setNestedComments] = useState<Comment[]>([]);

  // State modifiers
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [rootCommentInput, setRootCommentInput] = useState('');
  const [replyInputMap, setReplyInputMap] = useState<Record<number, string>>({});
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null);
  
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Aux data loader
  useEffect(() => {
    async function fetchCategoriesList() {
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch (err) {
        console.warn('Could not load categories catalog', err);
      }
    }
    fetchCategoriesList();
  }, []);

  // Main post detail loader
  const loadPostAndComments = async () => {
    if (!id) return;
    setLoading(true);
    setErrorStatus(null);
    try {
      // Load post, then attempt comments loader
      const postDetail = await getPostDetail(id);
      setPost(postDetail);

      // Extract Comments either embedded or via separate call
      let commentsList: Comment[] = [];
      try {
        commentsList = await getComments(id);
      } catch {
        console.warn('Post comments fetch subroute failed, using blank array');
      }
      setFlatComments(commentsList);
      setNestedComments(groupCommentsFromFlat(commentsList));
    } catch (err: any) {
      console.error('Fetch detail error:', err);
      setErrorStatus(
        err.message || '获取文章详情失败。请检查后端或端口：http://localhost:6133'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPostAndComments();
  }, [id]);

  // Inline Operations helpers
  const handleTogglePublishStatus = async () => {
    if (!post || !id) return;
    const isDraft = isDraftStatus(post.status);

    try {
      const updated = isDraft ? await publishPost(id) : await draftPost(id);
      setPost({ ...post, ...updated, status: updated.status });
    } catch (err: unknown) {
      alert(`变更发布状态失败: ${getApiError(err)}`);
    }
  };

  const handleDeletePost = async () => {
    if (!post || !id) return;
    if (!window.confirm('您确定要彻底删除该博文吗？这一操作无法撤销。')) return;

    try {
      await deletePost(id);
      navigate('/');
    } catch (err: any) {
      alert(`删除博文失败: ${getApiError(err)}`);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('确定删除这条评论吗？')) return;
    try {
      await deleteComment(commentId);
      const remaining = flatComments.filter((c) => c.id !== commentId);
      setFlatComments(remaining);
      setNestedComments(groupCommentsFromFlat(remaining));
    } catch (err: unknown) {
      alert(`删除评论失败: ${getApiError(err)}`);
    }
  };

  const canDeleteComment = (comment: Comment) =>
    !!user && (isAdmin || comment.userId === user.id || comment.user_id === user.id);

  // Comments submit controllers
  const handlePostComment = async (e: React.FormEvent, parentId: number | null = null) => {
    e.preventDefault();
    if (!id) return;

    const inputContent = parentId ? replyInputMap[parentId] : rootCommentInput;
    if (!inputContent?.trim()) return;

    setSubmittingComment(true);
    setErrorStatus(null);
    try {
      const response = await createComment(id, inputContent.trim(), parentId);
      
      // Merge new comment into flat flow
      const mergedComments = [...flatComments, response];
      setFlatComments(mergedComments);
      setNestedComments(groupCommentsFromFlat(mergedComments));

      // Reset targets and forms
      if (parentId) {
        setReplyInputMap({
          ...replyInputMap,
          [parentId]: '',
        });
        setReplyTargetId(null);
      } else {
        setRootCommentInput('');
      }
    } catch (err: any) {
      console.error('Comment posting encountered exception:', err);
      setErrorStatus(err.response?.data?.message || err.message || '发布评论失败');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Helper variables
  const canManagePost = post ? canUserManagePost(post, user?.id, isAdmin) : false;
  const dateStr = post?.createdAt || post?.created_at || '';
  const formattedDate = dateStr ? new Date(dateStr).toISOString().replace('T', ' ').slice(0, 16) : '';
  const coverUrl = resolveAssetUrl(
    post?.coverImage || post?.cover || post?.coverUrl
  );
  const isDraftState = isDraftStatus(post?.status);

  // Extract category text
  const categoryName =
    post && typeof post.category === 'object' && post.category
      ? post.category.name
      : post && typeof post.category === 'string'
      ? post.category
      : categories.find((c) => c.id === post?.categoryId || c.id === post?.category_id)?.name;

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-24 flex flex-col justify-center items-center flex-grow">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-200 border-t-blue-700 mb-3"></div>
        <span className="text-xs text-gray-400 font-sans">文章装载中...</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-16 flex-grow w-full">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-700 font-semibold mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回首页</span>
        </button>
        <div className="bg-white border border-gray-250 p-12 rounded-2xl text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-gray-900 font-bold mb-1">未找到文章详情</h3>
          <p className="text-gray-500 text-xs mb-6">
            该文章可能已被删除，或者您的网络接口解析地址错误。
          </p>
          <Link to="/" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer shadow-sm">
            返回博文列表
          </Link>
        </div>
      </div>
    );
  }

  // Recursive Comment Thread view component
  const CommentNode: React.FC<{ comment: Comment; depth?: number }> = ({ comment, depth = 0 }) => {
    const commentAuthor = getCommentAuthorName(comment);
    const cDate = comment.createdAt || comment.created_at || '';
    const formattedCDate = cDate ? new Date(cDate).toISOString().split('T')[0] : '刚刚';

    const isReplying = replyTargetId === comment.id;

    return (
      <div className={`${depth > 0 ? 'mt-1' : ''}`}>
        <div className="py-2.5 px-1 border-b border-gray-100 last:border-b-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <UserAvatar
                name={commentAuthor}
                avatarUrl={comment.authorAvatarUrl}
                size="sm"
              />
              <span className="text-xs font-medium text-gray-800 truncate">{commentAuthor}</span>
            </div>
            <span className="text-[10px] text-gray-400 shrink-0">{formattedCDate}</span>
          </div>
          <p className="text-sm text-gray-700 leading-snug break-words whitespace-pre-wrap">{comment.content}</p>
          {user && (
            <div className="flex justify-end gap-3 mt-1.5">
              {canDeleteComment(comment) && (
                <button
                  type="button"
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-[11px] text-red-500 hover:text-red-700 cursor-pointer"
                >
                  删除
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (isReplying) {
                    setReplyTargetId(null);
                  } else {
                    setReplyTargetId(comment.id);
                    setReplyInputMap({
                      ...replyInputMap,
                      [comment.id]: replyInputMap[comment.id] || '',
                    });
                  }
                }}
                className="text-[11px] text-gray-500 hover:text-blue-700 cursor-pointer"
              >
                {isReplying ? '取消' : '回复'}
              </button>
            </div>
          )}
        </div>

        {isReplying && user && (
          <form
            onSubmit={(e) => handlePostComment(e, comment.id)}
            className="flex gap-2 items-end py-2 pl-3 ml-2 border-l-2 border-blue-100"
          >
            <textarea
              placeholder={`回复 ${commentAuthor}…`}
              rows={2}
              value={replyInputMap[comment.id] || ''}
              onChange={(e) =>
                setReplyInputMap({
                  ...replyInputMap,
                  [comment.id]: e.target.value,
                })
              }
              className="flex-1 bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-lg px-2.5 py-2 text-xs outline-none text-gray-700 resize-none"
              required
            />
            <button
              type="submit"
              disabled={submittingComment}
              className="bg-blue-700 hover:bg-blue-800 text-white text-[11px] px-3 py-2 rounded-lg cursor-pointer shrink-0"
            >
              提交
            </button>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-4 border-l border-gray-100 pl-2">
            {comment.replies.map((child) => (
              <CommentNode key={child.id} comment={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-[800px] mx-auto px-6 py-8 flex-grow w-full">
      {/* Return home controller */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-700 font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回首页</span>
        </button>
        {user && canManagePost && (
          <div className="flex items-center gap-2">
            {/* Toggle publishing state */}
            <button
              onClick={handleTogglePublishStatus}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm border transition-colors cursor-pointer ${
                isDraftState
                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-750 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {isDraftState ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>设置为公开发布</span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  <span>设置为草稿下架</span>
                </>
              )}
            </button>
            <Link
              to={`/editor/${post.id}`}
              className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-shadow text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>编辑文章</span>
            </Link>
            <button
              onClick={handleDeletePost}
              className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>删除文章</span>
            </button>
          </div>
        )}
      </div>

      {isDraftStatus(post.status) && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-xs font-semibold flex gap-2 mb-6 shadow-sm">
          <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>该文章目前处于草稿编辑状态，仅作为您的个人存储。</span>
        </div>
      )}

      {/* Title block */}
      <div id="article-header" className="mb-6">
        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded inline-block mb-3.5 uppercase tracking-wider">
          {categoryName || '未分类'}
        </span>
        <h1 className="text-2xl md:text-3.5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
          {post.title}
        </h1>
        
        {/* Author meta row */}
        <div className="flex flex-wrap items-center text-xs text-gray-500 gap-y-2 gap-x-4 border-b border-gray-100 pb-5">
          <span className="text-gray-700">{formatAuthorMeta(post)}</span>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>发布日期 {formattedDate}</span>
          </div>
          {(post.views !== undefined || post.readCount !== undefined) && (
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-gray-400" />
              <span>{post.views !== undefined ? post.views : post.readCount} 次阅读</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Cover container */}
      {coverUrl && (
        <div className="w-full max-h-[400px] rounded-2xl overflow-hidden mb-8 shadow-sm border border-gray-200">
          <img
            src={coverUrl}
            alt={post.title}
            className="w-full h-full object-cover max-h-[400px]"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Article Markdown body render */}
      <article className="prose max-w-none bg-white p-6 md:p-8 rounded-2xl border border-gray-250 shadow-sm mb-12">
        <MarkdownRenderer>{post.content || ''}</MarkdownRenderer>
      </article>

      {/* Linked Tags block */}
      {Array.isArray(post.tags) && post.tags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">检索标签:</span>
          {post.tags.map((tagObj: any, index: number) => {
            const name = typeof tagObj === 'object' ? tagObj?.name : String(tagObj);
            return (
              <span key={index} className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-md">
                #{name}
              </span>
            );
          })}
        </div>
      )}

      {/* Comments section */}
      <section id="comments-section" className="border-t border-gray-200 pt-6 mt-8">
        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <span>评论 ({flatComments.length})</span>
        </h3>

        <div className="mb-3">
          {user ? (
            <form onSubmit={(e) => handlePostComment(e, null)} className="space-y-2">
              <textarea
                placeholder="写下你的想法…"
                rows={2}
                maxLength={1000}
                value={rootCommentInput}
                onChange={(e) => setRootCommentInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-lg px-3 py-2 text-sm outline-none text-gray-800 resize-none"
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="bg-blue-700 hover:bg-blue-800 text-white text-xs px-4 py-2 rounded-lg cursor-pointer"
                >
                  {submittingComment ? '提交中…' : '发表评论'}
                </button>
              </div>
            </form>
          ) : (
            <div className="py-3 text-center text-xs text-gray-500">
              <span className="block mb-2">登录后可参与讨论</span>
              <Link to="/login" className="text-blue-700 hover:underline font-medium">
                前往登录
              </Link>
            </div>
          )}
        </div>

        {nestedComments.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-4">暂无评论，来抢沙发吧</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {nestedComments.map((rootComment) => (
              <CommentNode key={rootComment.id} comment={rootComment} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
