using BlogApi.Core.Common;
using BlogApi.Core.Models.Posts;

namespace BlogApi.Core.Interfaces;

public interface IPostService
{
    Task<PostDetailItem> CreateAsync(CreatePostRequest request, int userId);
    Task<PostDetailItem> UpdateAsync(int id, UpdatePostRequest request, int userId, bool isAdmin);
    Task DeleteAsync(int id, int userId, bool isAdmin);
    Task<PostDetailItem> PublishAsync(int id, int userId, bool isAdmin);
    Task<PostDetailItem> RevertToDraftAsync(int id, int userId, bool isAdmin);
    Task<PostDetailItem> GetByIdAsync(int id, int? userId, bool isAdmin, string clientIp);
    Task<PagedResult<PostListItem>> GetPostsAsync(PostQuery query);
    Task<PagedResult<PostListItem>> GetMyPostsAsync(int userId, PostQuery query);
}
