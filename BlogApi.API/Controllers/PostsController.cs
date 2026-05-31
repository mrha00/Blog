using BlogApi.API.Common;
using BlogApi.API.DTOs.Comments;
using BlogApi.API.DTOs.Posts;
using BlogApi.Core.Common;
using BlogApi.Core.Constants;
using BlogApi.Core.Interfaces;
using BlogApi.Core.Models.Comments;
using BlogApi.Core.Models.Posts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BlogApi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PostsController : ControllerBase
{
    private readonly IPostService _postService;
    private readonly ICommentService _commentService;

    public PostsController(IPostService postService, ICommentService commentService)
    {
        _postService = postService;
        _commentService = commentService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<PostListDto>>>> GetPosts([FromQuery] PostQueryDto query)
    {
        var result = await _postService.GetPostsAsync(new PostQuery(
            query.Keyword,
            query.CategoryId,
            query.TagId,
            query.Page,
            query.PageSize,
            query.SortBy,
            query.Descending));

        return Ok(ApiResponse<PagedResult<PostListDto>>.Success(new PagedResult<PostListDto>(
            result.Items.Select(MapToListDto).ToList(),
            result.TotalCount,
            result.Page,
            result.PageSize)));
    }

    [Authorize]
    [HttpGet("mine")]
    public async Task<ActionResult<ApiResponse<PagedResult<PostListDto>>>> GetMyPosts([FromQuery] PostQueryDto query)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _postService.GetMyPostsAsync(userId, new PostQuery(
            query.Keyword,
            query.CategoryId,
            query.TagId,
            query.Page,
            query.PageSize,
            query.SortBy,
            query.Descending,
            userId));

        return Ok(ApiResponse<PagedResult<PostListDto>>.Success(new PagedResult<PostListDto>(
            result.Items.Select(MapToListDto).ToList(),
            result.TotalCount,
            result.Page,
            result.PageSize)));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<PostDetailDto>>> GetPost(int id)
    {
        int? userId = null;
        var isAdmin = false;

        if (User.Identity?.IsAuthenticated == true)
        {
            userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            isAdmin = User.IsInRole(Roles.Admin);
        }

        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var item = await _postService.GetByIdAsync(id, userId, isAdmin, clientIp);
        return Ok(ApiResponse<PostDetailDto>.Success(MapToDetailDto(item)));
    }

    [HttpGet("{postId:int}/comments")]
    public async Task<ActionResult<ApiResponse<List<CommentDto>>>> GetComments(int postId)
    {
        var items = await _commentService.GetByPostIdAsync(postId);
        return Ok(ApiResponse<List<CommentDto>>.Success(items.Select(MapToCommentDto).ToList()));
    }

    [Authorize]
    [HttpPost("{postId:int}/comments")]
    public async Task<ActionResult<ApiResponse<CommentDto>>> CreateComment(int postId, CreateCommentDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var item = await _commentService.CreateAsync(
            postId,
            new CreateCommentRequest(dto.Content, dto.ParentId),
            userId);
        return Ok(ApiResponse<CommentDto>.Success(MapToCommentDto(item), "评论已发表"));
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<PostDetailDto>>> CreatePost(CreatePostDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var item = await _postService.CreateAsync(MapToCreateRequest(dto), userId);
        return Ok(ApiResponse<PostDetailDto>.Success(MapToDetailDto(item), "文章已创建"));
    }

    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<PostDetailDto>>> UpdatePost(int id, UpdatePostDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole(Roles.Admin);
        var item = await _postService.UpdateAsync(id, MapToUpdateRequest(dto), userId, isAdmin);
        return Ok(ApiResponse<PostDetailDto>.Success(MapToDetailDto(item), "文章已更新"));
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> DeletePost(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole(Roles.Admin);
        await _postService.DeleteAsync(id, userId, isAdmin);
        return Ok(ApiResponse<object>.Success(null!, "文章已删除"));
    }

    [Authorize]
    [HttpPost("{id:int}/publish")]
    public async Task<ActionResult<ApiResponse<PostDetailDto>>> PublishPost(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole(Roles.Admin);
        var item = await _postService.PublishAsync(id, userId, isAdmin);
        return Ok(ApiResponse<PostDetailDto>.Success(MapToDetailDto(item), "文章已发布"));
    }

    [Authorize]
    [HttpPost("{id:int}/draft")]
    public async Task<ActionResult<ApiResponse<PostDetailDto>>> RevertToDraft(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole(Roles.Admin);
        var item = await _postService.RevertToDraftAsync(id, userId, isAdmin);
        return Ok(ApiResponse<PostDetailDto>.Success(MapToDetailDto(item), "文章已转为草稿"));
    }

    private static CreatePostRequest MapToCreateRequest(CreatePostDto dto)
    {
        return new CreatePostRequest(
            dto.Title,
            dto.Content,
            dto.Summary,
            dto.CategoryId,
            dto.TagIds,
            dto.CoverUrl);
    }

    private static UpdatePostRequest MapToUpdateRequest(UpdatePostDto dto)
    {
        return new UpdatePostRequest(
            dto.Title,
            dto.Content,
            dto.Summary,
            dto.CategoryId,
            dto.TagIds,
            dto.CoverUrl);
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
            CreatedAt = item.CreatedAt
        };
    }

    private static PostDetailDto MapToDetailDto(PostDetailItem item)
    {
        return new PostDetailDto
        {
            Id = item.Id,
            Title = item.Title,
            Content = item.Content,
            Summary = item.Summary,
            CoverUrl = item.CoverUrl,
            Slug = item.Slug,
            Status = item.Status,
            CategoryName = item.CategoryName,
            Tags = item.Tags,
            AuthorId = item.AuthorId,
            AuthorName = item.AuthorName,
            ViewCount = item.ViewCount,
            CreatedAt = item.CreatedAt,
            PublishedAt = item.PublishedAt
        };
    }

    private static CommentDto MapToCommentDto(CommentTreeItem item)
    {
        return new CommentDto
        {
            Id = item.Id,
            Content = item.Content,
            UserName = item.UserName,
            UserId = item.UserId,
            AuthorAvatarUrl = item.AuthorAvatarUrl,
            CreatedAt = item.CreatedAt,
            ParentId = item.ParentId,
            Replies = item.Replies.Select(MapToCommentDto).ToList()
        };
    }
}
