import React, { useState, useEffect, useCallback } from 'react';
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
import { useToast } from '../context/ToastContext';
import { canUserManagePost, getPostCategoryName } from '../utils/apiHelpers';
import { groupCommentsFromFlat } from '../utils/commentHelpers';
import { getPostAuthorLabel } from '../utils/displayName';
import CommentThread from '../components/CommentThread';
import UserLink from '../components/UserLink';
import ReadingProgress from '../components/ReadingProgress';
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
} from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  
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
      toast.error(`变更发布状态失败: ${getApiError(err)}`);
    }
  };

  const handleDeletePost = async () => {
    if (!post || !id) return;
    if (!window.confirm('您确定要彻底删除该博文吗？这一操作无法撤销。')) return;

    try {
      await deletePost(id);
      navigate('/');
    } catch (err: unknown) {
      toast.error(`删除博文失败: ${getApiError(err)}`);
    }
  };

  const handleDeleteComment = useCallback(async (commentId: number) => {
    if (!window.confirm('确定删除这条评论吗？')) return;
    try {
      await deleteComment(commentId);
      setFlatComments((prev) => {
        const remaining = prev.filter((c) => c.id !== commentId);
        setNestedComments(groupCommentsFromFlat(remaining));
        return remaining;
      });
    } catch (err: unknown) {
      toast.error(`删除评论失败: ${getApiError(err)}`);
    }
  }, [toast]);

  const handleReplyTargetChange = useCallback((commentId: number | null) => {
    setReplyTargetId(commentId);
    if (commentId !== null) {
      setReplyInputMap((prev) => ({
        ...prev,
        [commentId]: prev[commentId] || '',
      }));
    }
  }, []);

  const handleReplyInputChange = useCallback((commentId: number, value: string) => {
    setReplyInputMap((prev) => ({
      ...prev,
      [commentId]: value,
    }));
  }, []);

  const handlePostComment = useCallback(async (e: React.FormEvent, parentId: number | null = null) => {
    e.preventDefault();
    if (!id) return;

    const inputContent = parentId ? replyInputMap[parentId] : rootCommentInput;
    if (!inputContent?.trim()) return;

    setSubmittingComment(true);
    setErrorStatus(null);
    try {
      const response = await createComment(id, inputContent.trim(), parentId);

      setFlatComments((prev) => {
        const mergedComments = [...prev, response];
        setNestedComments(groupCommentsFromFlat(mergedComments));
        return mergedComments;
      });

      if (parentId) {
        setReplyInputMap((prev) => ({
          ...prev,
          [parentId]: '',
        }));
        setReplyTargetId(null);
      } else {
        setRootCommentInput('');
      }
    } catch (err: unknown) {
      console.error('Comment posting encountered exception:', err);
      setErrorStatus(getApiError(err, '发布评论失败'));
    } finally {
      setSubmittingComment(false);
    }
  }, [id, replyInputMap, rootCommentInput]);

  // Helper variables
  const canManagePost = post ? canUserManagePost(post, user?.id, isAdmin) : false;
  const dateStr = post?.createdAt || '';
  const formattedDate = dateStr ? new Date(dateStr).toISOString().replace('T', ' ').slice(0, 16) : '';
  const coverUrl = resolveAssetUrl(post?.coverUrl);
  const isDraftState = isDraftStatus(post?.status);

  const categoryName = post ? getPostCategoryName(post, categories) : undefined;

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

  return (
    <>
      <ReadingProgress />
      <div className="mx-auto w-full max-w-4xl flex-grow px-6 py-8">
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
      <div id="article-header" className="relative mb-8 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        {coverUrl && (
          <div className="relative h-48 md:h-64">
            <img
              src={coverUrl}
              alt={post.title}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent" />
          </div>
        )}
        <div className={`relative p-6 md:p-8 ${coverUrl ? '-mt-16' : ''}`}>
          <span className="mb-3 inline-block rounded-md bg-blue-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
            {categoryName || '未分类'}
          </span>
          <h1 className={`font-display text-3xl font-extrabold leading-tight tracking-tight md:text-4xl ${coverUrl ? 'text-white drop-shadow-sm' : 'text-gray-900'}`}>
            {post.title}
          </h1>
          <div className={`mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-5 text-xs ${coverUrl ? 'border-white/20 text-blue-50' : 'border-gray-100 text-gray-500'}`}>
            <span className={coverUrl ? 'font-medium text-white' : 'text-gray-700'}>
              作者 ·{' '}
              <UserLink
                userId={post.authorId}
                name={getPostAuthorLabel(post)}
                className={coverUrl ? 'text-white hover:text-blue-100' : ''}
              />
            </span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 opacity-70" />
              <span>{formattedDate}</span>
            </div>
            {(post.views !== undefined || post.readCount !== undefined) && (
              <div className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 opacity-70" />
                <span>{post.views !== undefined ? post.views : post.readCount} 次阅读</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Article Markdown body render */}
      <article className="prose max-w-none rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-10 mb-12">
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
      <section id="comments-section" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-1.5 text-base font-bold text-gray-800">
          <MessageSquare className="h-4 w-4 text-blue-600" />
          <span>讨论区 · {flatComments.length} 条评论</span>
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

        <CommentThread
          comments={nestedComments}
          user={user}
          isAdmin={isAdmin}
          replyTargetId={replyTargetId}
          replyInputMap={replyInputMap}
          submittingComment={submittingComment}
          onReplyTargetChange={handleReplyTargetChange}
          onReplyInputChange={handleReplyInputChange}
          onSubmitReply={handlePostComment}
          onDeleteComment={handleDeleteComment}
        />
      </section>
      </div>
    </>
  );
}
