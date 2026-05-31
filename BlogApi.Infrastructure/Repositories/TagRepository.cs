using BlogApi.Core.Entities;
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

    public async Task<bool> NameExistsAsync(string name)
    {
        return await _db.Tags.AnyAsync(t => t.Name == name);
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
}
