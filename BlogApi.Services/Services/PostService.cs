using BlogApi.Core.Entities;
using BlogApi.Core.Enums;
using BlogApi.Core.Exceptions;
using BlogApi.Core.Interfaces;
using BlogApi.Core.Common;
using BlogApi.Core.Models.Posts;
using BlogApi.Services.Helpers;

namespace BlogApi.Services.Services;

public class PostService : IPostService
{
    private readonly IPostRepository _postRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly ITagRepository _tagRepository;
    private readonly ViewCountService _viewCountService;
    private readonly PostCacheService _postCacheService;

    public PostService(
        IPostRepository postRepository,
        ICategoryRepository categoryRepository,
        ITagRepository tagRepository,
        ViewCountService viewCountService,
        PostCacheService postCacheService)
    {
        _postRepository = postRepository;
        _categoryRepository = categoryRepository;
        _tagRepository = tagRepository;
        _viewCountService = viewCountService;
        _postCacheService = postCacheService;
    }

    public async Task<PostDetailItem> CreateAsync(CreatePostRequest request, int userId)
    {
        await EnsureCategoryExistsAsync(request.CategoryId);
        var tags = await ResolveTagsAsync(request.TagIds);

        var baseSlug = SlugHelper.GenerateSlug(request.Title);
        var slug = await SlugHelper.EnsureUniqueSlugAsync(baseSlug, _postRepository);

        var post = new Post
        {
            Title = request.Title,
            Content = request.Content,
            Summary = request.Summary,
            CoverUrl = request.CoverUrl,
            CategoryId = request.CategoryId,
            AuthorId = userId,
            Status = PostStatus.Draft,
            Slug = slug,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var tag in tags)
        {
            post.Tags.Add(tag);
        }

        post = await _postRepository.AddAsync(post);
        return (await _postRepository.GetDetailByIdAsync(post.Id))!;
    }

    public async Task<PostDetailItem> UpdateAsync(int id, UpdatePostRequest request, int userId, bool isAdmin)
    {
        var post = await _postRepository.GetByIdWithTagsAsync(id)
            ?? throw new NotFoundException("文章不存在");

        EnsureAuthorOrAdmin(post.AuthorId, userId, isAdmin);
        await EnsureCategoryExistsAsync(request.CategoryId);

        var tags = await ResolveTagsAsync(request.TagIds);
        var titleChanged = post.Title != request.Title;

        post.Title = request.Title;
        post.Content = request.Content;
        post.Summary = request.Summary;
        post.CoverUrl = request.CoverUrl;
        post.CategoryId = request.CategoryId;
        post.UpdatedAt = DateTime.UtcNow;

        if (titleChanged)
        {
            var baseSlug = SlugHelper.GenerateSlug(request.Title);
            post.Slug = await SlugHelper.EnsureUniqueSlugAsync(baseSlug, _postRepository, id);
        }

        post.Tags.Clear();
        foreach (var tag in tags)
        {
            post.Tags.Add(tag);
        }

        await _postRepository.UpdateAsync(post);
        await _postCacheService.InvalidateAsync(id);
        return (await _postRepository.GetDetailByIdAsync(id))!;
    }

    public async Task DeleteAsync(int id, int userId, bool isAdmin)
    {
        var post = await _postRepository.GetByIdWithTagsAsync(id)
            ?? throw new NotFoundException("文章不存在");

        EnsureAuthorOrAdmin(post.AuthorId, userId, isAdmin);
        await _postRepository.DeleteAsync(post);
        await _postCacheService.InvalidateAsync(id);
    }

    public async Task<PostDetailItem> PublishAsync(int id, int userId, bool isAdmin)
    {
        var post = await _postRepository.GetByIdWithTagsAsync(id)
            ?? throw new NotFoundException("文章不存在");

        EnsureAuthorOrAdmin(post.AuthorId, userId, isAdmin);

        post.Status = PostStatus.Published;
        post.PublishedAt = DateTime.UtcNow;
        post.UpdatedAt = DateTime.UtcNow;

        await _postRepository.UpdateAsync(post);
        await _postCacheService.InvalidateAsync(id);
        return (await _postRepository.GetDetailByIdAsync(id))!;
    }

    public async Task<PostDetailItem> RevertToDraftAsync(int id, int userId, bool isAdmin)
    {
        var post = await _postRepository.GetByIdWithTagsAsync(id)
            ?? throw new NotFoundException("文章不存在");

        EnsureAuthorOrAdmin(post.AuthorId, userId, isAdmin);

        post.Status = PostStatus.Draft;
        post.UpdatedAt = DateTime.UtcNow;

        await _postRepository.UpdateAsync(post);
        await _postCacheService.InvalidateAsync(id);
        return (await _postRepository.GetDetailByIdAsync(id))!;
    }

    public async Task<PostDetailItem> GetByIdAsync(int id, int? userId, bool isAdmin, string clientIp)
    {
        if (await _postCacheService.IsNotFoundAsync(id))
        {
            throw new NotFoundException("文章不存在");
        }

        var post = await _postRepository.GetByIdWithTagsAsync(id);
        if (post is null)
        {
            await _postCacheService.SetNotFoundAsync(id);
            throw new NotFoundException("文章不存在");
        }

        if (post.Status != PostStatus.Published)
        {
            if (!userId.HasValue)
            {
                throw new ForbiddenException("无权查看该文章");
            }

            EnsureAuthorOrAdmin(post.AuthorId, userId.Value, isAdmin);
        }

        await _viewCountService.IncrementViewCountAsync(id, clientIp);

        var item = await _postCacheService.GetAsync(id);
        if (item is null)
        {
            item = await _postRepository.GetDetailByIdAsync(id);
            if (item is not null)
            {
                await _postCacheService.SetAsync(id, item);
            }
        }

        item ??= (await _postRepository.GetDetailByIdAsync(id))!;

        var viewCount = await _postRepository.GetViewCountAsync(id) ?? item.ViewCount;
        return item with { ViewCount = viewCount };
    }

    public async Task<PagedResult<PostListItem>> GetPostsAsync(PostQuery query)
    {
        if (query.Page < 1)
        {
            throw new ArgumentException("页码从 1 开始");
        }

        var normalized = query with
        {
            PageSize = Math.Clamp(query.PageSize, 1, 100)
        };

        return await _postRepository.GetPostsAsync(normalized);
    }

    private static void EnsureAuthorOrAdmin(int authorId, int userId, bool isAdmin)
    {
        if (!isAdmin && authorId != userId)
        {
            throw new ForbiddenException("无权操作该文章");
        }
    }

    private async Task EnsureCategoryExistsAsync(int categoryId)
    {
        if (await _categoryRepository.GetByIdAsync(categoryId) is null)
        {
            throw new ArgumentException("分类不存在");
        }
    }

    private async Task<List<Tag>> ResolveTagsAsync(List<int> tagIds)
    {
        if (tagIds.Count == 0)
        {
            return new List<Tag>();
        }

        var tags = await _tagRepository.GetByIdsAsync(tagIds);
        if (tags.Count != tagIds.Distinct().Count())
        {
            throw new ArgumentException("存在无效的标签 Id");
        }

        return tags;
    }
}
