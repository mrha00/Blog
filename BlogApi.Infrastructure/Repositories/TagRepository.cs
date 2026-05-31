using BlogApi.Core.Entities;
using BlogApi.Core.Helpers;
using BlogApi.Core.Interfaces;
using BlogApi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BlogApi.Infrastructure.Repositories;

public class TagRepository : ITagRepository
{
    private readonly AppDbContext _db;

    public TagRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<Tag>> GetAllAsync()
    {
        return await _db.Tags.AsNoTracking().OrderBy(t => t.Name).ToListAsync();
    }

    public async Task<List<Tag>> GetByIdsAsync(IEnumerable<int> ids)
    {
        var idList = ids.Distinct().ToList();
        if (idList.Count == 0)
        {
            return new List<Tag>();
        }

        return await _db.Tags.Where(t => idList.Contains(t.Id)).ToListAsync();
    }

    public async Task<Tag> AddAsync(Tag tag)
    {
        _db.Tags.Add(tag);
        await _db.SaveChangesAsync();
        return tag;
    }

    public async Task<bool> NameExistsAsync(string name, int? excludeId = null)
    {
        return await _db.Tags.AnyAsync(t =>
            t.Name == name && (!excludeId.HasValue || t.Id != excludeId.Value));
    }

    public async Task<Tag?> GetByIdAsync(int id)
    {
        return await _db.Tags.FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<bool> IsUsedByPostsAsync(int id)
    {
        return await _db.Tags
            .Where(t => t.Id == id)
            .AnyAsync(t => t.Posts.Any());
    }

    public async Task DeleteAsync(Tag tag)
    {
        _db.Tags.Remove(tag);
        await _db.SaveChangesAsync();
    }

    public async Task<int> DeleteTestTagsAsync()
    {
        var allTags = await _db.Tags.Include(t => t.Posts).ToListAsync();
        var toRemove = allTags.Where(t => CatalogTestDataFilter.IsTestName(t.Name)).ToList();
        if (toRemove.Count == 0)
        {
            return 0;
        }

        foreach (var tag in toRemove)
        {
            tag.Posts.Clear();
            _db.Tags.Remove(tag);
        }

        await _db.SaveChangesAsync();
        return toRemove.Count;
    }

    public async Task<Tag> UpdateAsync(Tag tag)
    {
        _db.Tags.Update(tag);
        await _db.SaveChangesAsync();
        return tag;
    }
}
