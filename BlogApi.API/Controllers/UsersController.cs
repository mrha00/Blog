using BlogApi.API.Common;
using BlogApi.API.DTOs.Posts;
using BlogApi.API.DTOs.Users;
using BlogApi.Core.Common;
using BlogApi.Core.Interfaces;
using BlogApi.Core.Models.Posts;
using BlogApi.Core.Models.Users;
using Microsoft.AspNetCore.Mvc;

namespace BlogApi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<PublicUserDto>>> GetUser(int id)
    {
        var profile = await _userService.GetPublicProfileAsync(id);
        return Ok(ApiResponse<PublicUserDto>.Success(MapToDto(profile)));
    }

    [HttpGet("{id:int}/posts")]
    public async Task<ActionResult<ApiResponse<PagedResult<PostListDto>>>> GetUserPosts(
        int id,
        [FromQuery] PostQueryDto query)
    {
        var result = await _userService.GetPublicPostsAsync(id, new PostQuery(
            query.Keyword,
            query.CategoryId,
            query.TagId,
            query.Page,
            query.PageSize,
            query.SortBy,
            query.Descending,
            id,
            PublishedOnly: true));

        return Ok(ApiResponse<PagedResult<PostListDto>>.Success(new PagedResult<PostListDto>(
            result.Items.Select(MapToListDto).ToList(),
            result.TotalCount,
            result.Page,
            result.PageSize)));
    }

    private static PublicUserDto MapToDto(PublicUserProfile profile)
    {
        return new PublicUserDto
        {
            Id = profile.Id,
            Username = profile.Username,
            Nickname = profile.Nickname,
            AvatarUrl = profile.AvatarUrl,
            Bio = profile.Bio,
            CreatedAt = profile.CreatedAt,
            PublishedPostCount = profile.PublishedPostCount,
        };
    }

    private static PostListDto MapToListDto(PostListItem item)
    {
        return new PostListDto
        {
            Id = item.Id,
            Title = item.Title,
            Summary = item.Summary,
            CategoryName = item.CategoryName,
            Tags = item.Tags,
            AuthorId = item.AuthorId,
            AuthorName = item.AuthorName,
            Status = item.Status,
            CreatedAt = item.CreatedAt,
            CoverUrl = item.CoverUrl
        };
    }
}
