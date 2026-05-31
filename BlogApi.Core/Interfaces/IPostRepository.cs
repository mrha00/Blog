using BlogApi.Core.Common;
using BlogApi.Core.Entities;
using BlogApi.Core.Enums;
using BlogApi.Core.Models.Posts;

namespace BlogApi.Core.Interfaces;

public interface IPostRepository
{
    Task<Post?> GetByIdWithTagsAsync(int id);
    Task<PostDetailItem?> GetDetailByIdAsync(int id);
    Task<PagedResult<PostListItem>> GetPostsAsync(PostQuery query);
    Task<bool> SlugExistsAsync(string slug, int? excludePostId);
    Task<PostStatus?> GetPostStatusAsync(int id);
    Task<int?> GetViewCountAsync(int id);
    Task IncrementViewCountAsync(int id);
    Task<Post> AddAsync(Post post);
    Task UpdateAsync(Post post);
    Task DeleteAsync(Post post);
}
