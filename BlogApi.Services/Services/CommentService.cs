using BlogApi.Core.Enums;
using BlogApi.Core.Exceptions;
using BlogApi.Core.Interfaces;
using BlogApi.Core.Models.Comments;

namespace BlogApi.Services.Services;

public class CommentService : ICommentService
{
    private readonly ICommentRepository _commentRepository;
    private readonly IPostRepository _postRepository;

    public CommentService(ICommentRepository commentRepository, IPostRepository postRepository)
    {
        _commentRepository = commentRepository;
        _postRepository = postRepository;
    }

    public async Task<List<CommentTreeItem>> GetByPostIdAsync(int postId)
    {
        var flat = await _commentRepository.GetFlatByPostIdAsync(postId);
        return BuildCommentTree(flat, parentId: null);
    }

    public async Task<CommentTreeItem> CreateAsync(int postId, CreateCommentRequest request, int userId)
    {
        var status = await _postRepository.GetPostStatusAsync(postId);
        if (status is null)
        {
            throw new NotFoundException("文章不存在");
        }

        if (status != PostStatus.Published)
        {
            throw new ArgumentException("仅已发布文章可评论");
        }

        if (request.ParentId.HasValue)
        {
            var parent = await _commentRepository.GetParentAsync(request.ParentId.Value, postId);
            if (parent is null)
            {
                throw new ArgumentException("父评论不存在或不属于该文章");
            }
        }

        var item = await _commentRepository.AddAsync(
            postId, userId, request.Content, request.ParentId);

        return MapToTreeItem(item);
    }

    public async Task SoftDeleteAsync(int commentId, int userId, bool isAdmin)
    {
        var ownership = await _commentRepository.GetOwnershipAsync(commentId);
        if (ownership is null || ownership.Value.IsDeleted)
        {
            throw new NotFoundException("评论不存在");
        }

        if (!isAdmin && ownership.Value.UserId != userId)
        {
            throw new ForbiddenException("无权删除该评论");
        }

        var deleted = await _commentRepository.SoftDeleteAsync(commentId);
        if (!deleted)
        {
            throw new NotFoundException("评论不存在");
        }
    }

    private static List<CommentTreeItem> BuildCommentTree(List<CommentItem> all, int? parentId)
    {
        return all
            .Where(c => c.ParentId == parentId)
            .Select(c =>
            {
                var node = MapToTreeItem(c);
                node.Replies = BuildCommentTree(all, c.Id);
                return node;
            })
            .ToList();
    }

    private static CommentTreeItem MapToTreeItem(CommentItem item)
    {
        return new CommentTreeItem
        {
            Id = item.Id,
            Content = item.Content,
            UserName = item.UserName,
            CreatedAt = item.CreatedAt,
            ParentId = item.ParentId,
            Replies = new List<CommentTreeItem>()
        };
    }
}
