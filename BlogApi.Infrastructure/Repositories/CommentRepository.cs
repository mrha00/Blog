using BlogApi.Core.Entities;
using BlogApi.Core.Interfaces;
using BlogApi.Core.Models.Comments;
using BlogApi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BlogApi.Infrastructure.Repositories;

public class CommentRepository : ICommentRepository
{
    private readonly AppDbContext _db;

    public CommentRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<CommentItem>> GetFlatByPostIdAsync(int postId)
    {
        return await _db.Comments
            .AsNoTracking()
            .Where(c => c.PostId == postId)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new CommentItem(
                c.Id,
                c.Content,
                c.User.Username,
                c.CreatedAt,
                c.ParentId))
            .ToListAsync();
    }

    public async Task<CommentItem?> GetByIdAsync(int id)
    {
        return await _db.Comments
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new CommentItem(
                c.Id,
                c.Content,
                c.User.Username,
                c.CreatedAt,
                c.ParentId))
            .FirstOrDefaultAsync();
    }

    public async Task<CommentItem?> GetParentAsync(int parentId, int postId)
    {
        return await _db.Comments
            .AsNoTracking()
            .Where(c => c.Id == parentId && c.PostId == postId)
            .Select(c => new CommentItem(
                c.Id,
                c.Content,
                c.User.Username,
                c.CreatedAt,
                c.ParentId))
            .FirstOrDefaultAsync();
    }

    public async Task<CommentItem> AddAsync(int postId, int userId, string content, int? parentId)
    {
        var comment = new Comment
        {
            PostId = postId,
            UserId = userId,
            Content = content,
            ParentId = parentId,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow
        };

        _db.Comments.Add(comment);
        await _db.SaveChangesAsync();

        return (await GetByIdAsync(comment.Id))!;
    }

    public async Task<bool> SoftDeleteAsync(int id)
    {
        var comment = await _db.Comments
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);

        if (comment is null)
        {
            return false;
        }

        comment.IsDeleted = true;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<(int UserId, bool IsDeleted)?> GetOwnershipAsync(int id)
    {
        var comment = await _db.Comments
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (comment is null)
        {
            return null;
        }

        return (comment.UserId, comment.IsDeleted);
    }
}
