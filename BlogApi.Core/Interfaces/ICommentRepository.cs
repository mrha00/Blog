using BlogApi.Core.Models.Comments;

namespace BlogApi.Core.Interfaces;

public interface ICommentRepository
{
    Task<List<CommentItem>> GetFlatByPostIdAsync(int postId);
    Task<CommentItem?> GetByIdAsync(int id);
    Task<CommentItem?> GetParentAsync(int parentId, int postId);
    Task<CommentItem> AddAsync(int postId, int userId, string content, int? parentId);
    Task<bool> SoftDeleteAsync(int id);
    Task<(int UserId, bool IsDeleted)?> GetOwnershipAsync(int id);
}
