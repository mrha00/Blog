import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Comment, User } from '../types';
import UserAvatar from './UserAvatar';
import UserLink from './UserLink';
import { getCommentAuthorName } from '../utils/commentHelpers';

const REPLIES_PREVIEW = 3;
const ROOT_PREVIEW = 30;

interface FlatReply extends Comment {
  replyToName?: string;
  replyToUserId?: number;
}

function collectFlatReplies(
  comment: Comment,
  parent?: { name: string; userId?: number },
  direct = true
): FlatReply[] {
  const result: FlatReply[] = [];
  for (const child of comment.replies ?? []) {
    result.push({
      ...child,
      replyToName: direct ? undefined : parent?.name,
      replyToUserId: direct ? undefined : parent?.userId,
    });
    result.push(
      ...collectFlatReplies(
        child,
        { name: getCommentAuthorName(child), userId: child.userId },
        false
      )
    );
  }
  return result;
}

interface ReplyRowProps {
  reply: FlatReply;
  user: User | null;
  isAdmin: boolean;
  replyTargetId: number | null;
  replyInputMap: Record<number, string>;
  submittingComment: boolean;
  onReplyTargetChange: (commentId: number | null) => void;
  onReplyInputChange: (commentId: number, value: string) => void;
  onSubmitReply: (e: React.FormEvent, parentId: number) => void;
  onDeleteComment: (commentId: number) => void;
}

function canDeleteComment(comment: Comment, user: User | null, isAdmin: boolean) {
  return !!user && (isAdmin || comment.userId === user.id);
}

function formatCommentDate(value?: string) {
  if (!value) return '刚刚';
  return new Date(value).toISOString().split('T')[0];
}

function ReplyRow({
  reply,
  user,
  isAdmin,
  replyTargetId,
  replyInputMap,
  submittingComment,
  onReplyTargetChange,
  onReplyInputChange,
  onSubmitReply,
  onDeleteComment,
}: ReplyRowProps) {
  const author = getCommentAuthorName(reply);
  const isReplying = replyTargetId === reply.id;

  return (
    <div className="border-t border-gray-100 py-2.5 pl-3 dark:border-slate-800">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {reply.userId ? (
            <Link to={`/users/${reply.userId}`} className="shrink-0">
              <UserAvatar name={author} avatarUrl={reply.authorAvatarUrl} size="sm" />
            </Link>
          ) : (
            <UserAvatar name={author} avatarUrl={reply.authorAvatarUrl} size="sm" />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <UserLink
                userId={reply.userId}
                name={author}
                className="text-xs text-gray-800 dark:text-slate-200"
              />
              {reply.replyToName && (
                <span className="text-[11px] text-gray-400 dark:text-slate-500">
                  回复{' '}
                  <UserLink
                    userId={reply.replyToUserId}
                    name={`@${reply.replyToName}`}
                    className="text-[11px] font-normal"
                  />
                </span>
              )}
            </div>
          </div>
        </div>
        <span className="shrink-0 text-[10px] text-gray-400 dark:text-slate-500">
          {formatCommentDate(reply.createdAt)}
        </span>
      </div>
      <p className="mt-1.5 break-words whitespace-pre-wrap text-sm leading-snug text-gray-700 dark:text-slate-300">
        {reply.content}
      </p>
      {user && (
        <div className="mt-1.5 flex justify-end gap-3">
          {canDeleteComment(reply, user, isAdmin) && (
            <button
              type="button"
              onClick={() => onDeleteComment(reply.id)}
              className="cursor-pointer text-[11px] text-red-500 hover:text-red-700"
            >
              删除
            </button>
          )}
          <button
            type="button"
            onClick={() => onReplyTargetChange(isReplying ? null : reply.id)}
            className="cursor-pointer text-[11px] text-gray-500 hover:text-blue-700 dark:hover:text-blue-400"
          >
            {isReplying ? '取消' : '回复'}
          </button>
        </div>
      )}
      {isReplying && user && (
        <form
          onSubmit={(e) => onSubmitReply(e, reply.id)}
          className="mt-2 flex items-end gap-2"
        >
          <textarea
            placeholder={`回复 ${author}…`}
            rows={2}
            value={replyInputMap[reply.id] || ''}
            onChange={(e) => onReplyInputChange(reply.id, e.target.value)}
            className="flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-xs text-gray-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            required
          />
          <button
            type="submit"
            disabled={submittingComment}
            className="shrink-0 cursor-pointer rounded-lg bg-blue-700 px-3 py-2 text-[11px] text-white hover:bg-blue-800 disabled:opacity-60"
          >
            提交
          </button>
        </form>
      )}
    </div>
  );
}

interface RootCommentBlockProps {
  comment: Comment;
  user: User | null;
  isAdmin: boolean;
  replyTargetId: number | null;
  replyInputMap: Record<number, string>;
  submittingComment: boolean;
  onReplyTargetChange: (commentId: number | null) => void;
  onReplyInputChange: (commentId: number, value: string) => void;
  onSubmitReply: (e: React.FormEvent, parentId: number) => void;
  onDeleteComment: (commentId: number) => void;
}

function RootCommentBlock({
  comment,
  user,
  isAdmin,
  replyTargetId,
  replyInputMap,
  submittingComment,
  onReplyTargetChange,
  onReplyInputChange,
  onSubmitReply,
  onDeleteComment,
}: RootCommentBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const author = getCommentAuthorName(comment);
  const isReplying = replyTargetId === comment.id;

  const flatReplies = useMemo(() => collectFlatReplies(comment), [comment]);

  const visibleReplies = expanded ? flatReplies : flatReplies.slice(0, REPLIES_PREVIEW);
  const hiddenCount = flatReplies.length - visibleReplies.length;

  return (
    <article className="rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {comment.userId ? (
            <Link to={`/users/${comment.userId}`} className="shrink-0">
              <UserAvatar name={author} avatarUrl={comment.authorAvatarUrl} size="sm" />
            </Link>
          ) : (
            <UserAvatar name={author} avatarUrl={comment.authorAvatarUrl} size="sm" />
          )}
          <UserLink
            userId={comment.userId}
            name={author}
            className="text-xs font-semibold text-gray-800 dark:text-slate-200"
          />
        </div>
        <span className="shrink-0 text-[10px] text-gray-400 dark:text-slate-500">
          {formatCommentDate(comment.createdAt)}
        </span>
      </div>
      <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-slate-200">
        {comment.content}
      </p>
      {user && (
        <div className="mt-2 flex justify-end gap-3">
          {canDeleteComment(comment, user, isAdmin) && (
            <button
              type="button"
              onClick={() => onDeleteComment(comment.id)}
              className="cursor-pointer text-[11px] text-red-500 hover:text-red-700"
            >
              删除
            </button>
          )}
          <button
            type="button"
            onClick={() => onReplyTargetChange(isReplying ? null : comment.id)}
            className="cursor-pointer text-[11px] text-gray-500 hover:text-blue-700 dark:hover:text-blue-400"
          >
            {isReplying ? '取消' : '回复'}
          </button>
        </div>
      )}

      {isReplying && user && (
        <form onSubmit={(e) => onSubmitReply(e, comment.id)} className="mt-2 flex items-end gap-2">
          <textarea
            placeholder={`回复 ${author}…`}
            rows={2}
            value={replyInputMap[comment.id] || ''}
            onChange={(e) => onReplyInputChange(comment.id, e.target.value)}
            className="flex-1 resize-none rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            required
          />
          <button
            type="submit"
            disabled={submittingComment}
            className="shrink-0 cursor-pointer rounded-lg bg-blue-700 px-3 py-2 text-[11px] text-white hover:bg-blue-800 disabled:opacity-60"
          >
            提交
          </button>
        </form>
      )}

      {flatReplies.length > 0 && (
        <div className="mt-2 border-l-2 border-blue-100 pl-2 dark:border-blue-900/60">
          {visibleReplies.map((reply) => (
            <ReplyRow
              key={reply.id}
              reply={reply}
              user={user}
              isAdmin={isAdmin}
              replyTargetId={replyTargetId}
              replyInputMap={replyInputMap}
              submittingComment={submittingComment}
              onReplyTargetChange={onReplyTargetChange}
              onReplyInputChange={onReplyInputChange}
              onSubmitReply={onSubmitReply}
              onDeleteComment={onDeleteComment}
            />
          ))}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-1 cursor-pointer px-3 py-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
            >
              展开 {hiddenCount} 条回复
            </button>
          )}
          {expanded && flatReplies.length > REPLIES_PREVIEW && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="mt-1 cursor-pointer px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400"
            >
              收起回复
            </button>
          )}
        </div>
      )}
    </article>
  );
}

interface CommentThreadProps {
  comments: Comment[];
  user: User | null;
  isAdmin: boolean;
  replyTargetId: number | null;
  replyInputMap: Record<number, string>;
  submittingComment: boolean;
  onReplyTargetChange: (commentId: number | null) => void;
  onReplyInputChange: (commentId: number, value: string) => void;
  onSubmitReply: (e: React.FormEvent, parentId: number) => void;
  onDeleteComment: (commentId: number) => void;
}

export default function CommentThread({
  comments,
  user,
  isAdmin,
  replyTargetId,
  replyInputMap,
  submittingComment,
  onReplyTargetChange,
  onReplyInputChange,
  onSubmitReply,
  onDeleteComment,
}: CommentThreadProps) {
  const [visibleRoots, setVisibleRoots] = useState(ROOT_PREVIEW);

  if (comments.length === 0) {
    return <p className="py-4 text-center text-xs text-gray-400 dark:text-slate-500">暂无评论，来抢沙发吧</p>;
  }

  const shown = comments.slice(0, visibleRoots);
  const remaining = comments.length - shown.length;

  return (
    <div className="space-y-3">
      {shown.map((root) => (
        <RootCommentBlock
          key={root.id}
          comment={root}
          user={user}
          isAdmin={isAdmin}
          replyTargetId={replyTargetId}
          replyInputMap={replyInputMap}
          submittingComment={submittingComment}
          onReplyTargetChange={onReplyTargetChange}
          onReplyInputChange={onReplyInputChange}
          onSubmitReply={onSubmitReply}
          onDeleteComment={onDeleteComment}
        />
      ))}
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setVisibleRoots((n) => n + ROOT_PREVIEW)}
          className="w-full cursor-pointer rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-400"
        >
          加载更多评论（还有 {remaining} 条）
        </button>
      )}
    </div>
  );
}
