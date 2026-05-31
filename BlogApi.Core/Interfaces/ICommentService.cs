using BlogApi.Core.Models.Comments;

namespace BlogApi.Core.Interfaces;

public interface ICommentService
{
    Task<List<CommentTreeItem>> GetByPostIdAsync(int postId);
    Task<CommentTreeItem> CreateAsync(int postId, CreateCommentRequest request, int userId);
    Task SoftDeleteAsync(int commentId, int userId, bool isAdmin);
}
