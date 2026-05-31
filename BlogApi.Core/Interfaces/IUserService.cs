using BlogApi.Core.Common;
using BlogApi.Core.Models.Posts;
using BlogApi.Core.Models.Users;

namespace BlogApi.Core.Interfaces;

public interface IUserService
{
    Task<PublicUserProfile> GetPublicProfileAsync(int userId);
    Task<PagedResult<PostListItem>> GetPublicPostsAsync(int userId, PostQuery query);
}
