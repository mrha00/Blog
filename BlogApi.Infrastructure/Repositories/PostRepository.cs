using BlogApi.Core.Common;
using BlogApi.Core.Entities;
using BlogApi.Core.Enums;
using BlogApi.Core.Interfaces;
using BlogApi.Core.Models.Posts;
using BlogApi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BlogApi.Infrastructure.Repositories;

public class PostRepository : IPostRepository
{
    private readonly AppDbContext _db;

    public PostRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Post?> GetByIdWithTagsAsync(int id)
    {
        return await _db.Posts
            .Include(p => p.Tags)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<PostDetailItem?> GetDetailByIdAsync(int id)
    {
        return await _db.Posts
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new PostDetailItem(
                p.Id,
                p.Title,
                p.Content,
                p.Summary,
                p.CoverUrl,
                p.Slug,
                p.Status,
                p.Category.Name,
                p.Tags.Select(t => t.Name).ToList(),
                p.AuthorId,
                string.IsNullOrEmpty(p.Author.Nickname) ? p.Author.Username : p.Author.Nickname,
                p.ViewCount,
                p.CreatedAt,
                p.PublishedAt))
            .FirstOrDefaultAsync();
    }

    public async Task<PagedResult<PostListItem>> GetPostsAsync(PostQuery query)
    {
        var posts = _db.Posts.AsNoTracking();

        if (query.AuthorId.HasValue)
        {
            posts = posts.Where(p => p.AuthorId == query.AuthorId.Value);
            if (query.PublishedOnly)
            {
                posts = posts.Where(p => p.Status == PostStatus.Published);
            }
        }
        else
        {
            posts = posts.Where(p => p.Status == PostStatus.Published);
        }

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            posts = posts.Where(p =>
                p.Title.Contains(query.Keyword) || p.Content.Contains(query.Keyword));
        }

        if (query.CategoryId.HasValue)
        {
            posts = posts.Where(p => p.CategoryId == query.CategoryId.Value);
        }

        if (query.TagId.HasValue)
        {
            posts = posts.Where(p => p.Tags.Any(t => t.Id == query.TagId.Value));
        }

        posts = ApplySorting(posts, query.SortBy, query.Descending);

        var totalCount = await posts.CountAsync();
        var pageSize = query.PageSize;

        var items = await posts
            .Skip((query.Page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PostListItem(
                p.Id,
                p.Title,
                p.Summary ?? string.Empty,
                p.Category.Name,
                p.Tags.Select(t => t.Name).ToList(),
                p.AuthorId,
                string.IsNullOrEmpty(p.Author.Nickname) ? p.Author.Username : p.Author.Nickname,
                p.Status,
                p.CreatedAt,
                p.CoverUrl))
            .ToListAsync();

        return new PagedResult<PostListItem>(items, totalCount, query.Page, pageSize);
    }

    public async Task<bool> SlugExistsAsync(string slug, int? excludePostId)
    {
        return await _db.Posts.AnyAsync(p =>
            p.Slug == slug && (!excludePostId.HasValue || p.Id != excludePostId.Value));
    }

    public async Task<PostStatus?> GetPostStatusAsync(int id)
    {
        return await _db.Posts
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => (PostStatus?)p.Status)
            .FirstOrDefaultAsync();
    }

    public async Task<int?> GetViewCountAsync(int id)
    {
        return await _db.Posts
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => (int?)p.ViewCount)
            .FirstOrDefaultAsync();
    }

    public async Task IncrementViewCountAsync(int id)
    {
        await _db.Posts
            .Where(p => p.Id == id)
            .ExecuteUpdateAsync(setters => setters.SetProperty(p => p.ViewCount, p => p.ViewCount + 1));
    }

    public async Task<Post> AddAsync(Post post)
    {
        _db.Posts.Add(post);
        await _db.SaveChangesAsync();
        return post;
    }

    public async Task UpdateAsync(Post post)
    {
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Post post)
    {
        post.IsDeleted = true;
        post.DeletedAt = DateTime.UtcNow;
        post.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    private static IQueryable<Post> ApplySorting(IQueryable<Post> query, string? sortBy, bool descending)
    {
        return sortBy?.ToLowerInvariant() switch
        {
            "title" => descending
                ? query.OrderByDescending(p => p.Title)
                : query.OrderBy(p => p.Title),
            "views" => descending
                ? query.OrderByDescending(p => p.ViewCount)
                : query.OrderBy(p => p.ViewCount),
            "date" or null or _ => descending
                ? query.OrderByDescending(p => p.CreatedAt)
                : query.OrderBy(p => p.CreatedAt)
        };
    }
}
