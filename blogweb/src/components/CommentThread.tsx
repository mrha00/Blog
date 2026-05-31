import React from 'react';
import { Comment, User } from '../types';
import UserAvatar from './UserAvatar';
import { getCommentAuthorName } from '../utils/commentHelpers';

interface CommentNodeProps {
  comment: Comment;
  depth?: number;
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

const CommentNode: React.FC<CommentNodeProps> = ({
  comment,
  depth = 0,
  user,
  isAdmin,
  replyTargetId,
  replyInputMap,
  submittingComment,
  onReplyTargetChange,
  onReplyInputChange,
  onSubmitReply,
  onDeleteComment,
}) => {
  const commentAuthor = getCommentAuthorName(comment);
  const cDate = comment.createdAt || '';
  const formattedCDate = cDate ? new Date(cDate).toISOString().split('T')[0] : '刚刚';
  const isReplying = replyTargetId === comment.id;

  return (
    <div className={depth > 0 ? 'mt-1' : ''}>
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
        <p className="text-sm text-gray-700 leading-snug break-words whitespace-pre-wrap">
          {comment.content}
        </p>
        {user && (
          <div className="flex justify-end gap-3 mt-1.5">
            {canDeleteComment(comment, user, isAdmin) && (
              <button
                type="button"
                onClick={() => onDeleteComment(comment.id)}
                className="text-[11px] text-red-500 hover:text-red-700 cursor-pointer"
              >
                删除
              </button>
            )}
            <button
              type="button"
              onClick={() => onReplyTargetChange(isReplying ? null : comment.id)}
              className="text-[11px] text-gray-500 hover:text-blue-700 cursor-pointer"
            >
              {isReplying ? '取消' : '回复'}
            </button>
          </div>
        )}
      </div>

      {isReplying && user && (
        <form
          onSubmit={(e) => onSubmitReply(e, comment.id)}
          className="flex gap-2 items-end py-2 pl-3 ml-2 border-l-2 border-blue-100"
        >
          <textarea
            placeholder={`回复 ${commentAuthor}…`}
            rows={2}
            value={replyInputMap[comment.id] || ''}
            onChange={(e) => onReplyInputChange(comment.id, e.target.value)}
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
            <CommentNode
              key={child.id}
              comment={child}
              depth={depth + 1}
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
        </div>
      )}
    </div>
  );
};

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
  if (comments.length === 0) {
    return <p className="text-center text-xs text-gray-400 py-4">暂无评论，来抢沙发吧</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {comments.map((rootComment) => (
        <CommentNode
          key={rootComment.id}
          comment={rootComment}
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
    </div>
  );
}
