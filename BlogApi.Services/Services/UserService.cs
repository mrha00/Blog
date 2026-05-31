using BlogApi.Core.Common;
using BlogApi.Core.Exceptions;
using BlogApi.Core.Interfaces;
using BlogApi.Core.Models.Posts;
using BlogApi.Core.Models.Users;

namespace BlogApi.Services.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IPostRepository _postRepository;
    private readonly PostListCacheService _postListCacheService;

    public UserService(
        IUserRepository userRepository,
        IPostRepository postRepository,
        PostListCacheService postListCacheService)
    {
        _userRepository = userRepository;
        _postRepository = postRepository;
        _postListCacheService = postListCacheService;
    }

    public async Task<PublicUserProfile> GetPublicProfileAsync(int userId)
    {
        var user = await _userRepository.GetByIdAsync(userId)
            ?? throw new NotFoundException("用户不存在");

        var postCount = await _userRepository.CountPublishedPostsAsync(userId);

        return new PublicUserProfile(
            user.Id,
            user.Username,
            string.IsNullOrWhiteSpace(user.Nickname) ? user.Username : user.Nickname,
            user.AvatarUrl,
            user.Bio,
            user.CreatedAt,
            postCount);
    }

    public async Task<PagedResult<PostListItem>> GetPublicPostsAsync(int userId, PostQuery query)
    {
        if (await _userRepository.GetByIdAsync(userId) is null)
        {
            throw new NotFoundException("用户不存在");
        }

        if (query.Page < 1)
        {
            throw new ArgumentException("页码从 1 开始");
        }

        var normalized = query with
        {
            AuthorId = userId,
            PublishedOnly = true,
            PageSize = Math.Clamp(query.PageSize, 1, 100)
        };

        var cached = await _postListCacheService.GetAsync(normalized);
        if (cached is not null)
        {
            return cached;
        }

        var result = await _postRepository.GetPostsAsync(normalized);
        await _postListCacheService.SetAsync(normalized, result);
        return result;
    }
}
