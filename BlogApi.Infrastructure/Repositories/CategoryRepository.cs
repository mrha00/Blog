using BlogApi.Core.Entities;
using BlogApi.Core.Interfaces;
using BlogApi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BlogApi.Infrastructure.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly AppDbContext _db;

    public CategoryRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Category?> GetByIdAsync(int id)
    {
        return await _db.Categories.FindAsync(id);
    }

    public async Task<List<Category>> GetAllAsync()
    {
        return await _db.Categories.AsNoTracking().OrderBy(c => c.Name).ToListAsync();
    }

    public async Task<Category> AddAsync(Category category)
    {
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();
        return category;
    }

    public async Task UpdateAsync(Category category)
    {
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Category category)
    {
        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
    }

    public async Task<bool> HasPostsAsync(int categoryId)
    {
        return await _db.Posts.AnyAsync(p => p.CategoryId == categoryId);
    }

    public async Task<bool> NameExistsAsync(string name, int? excludeId = null)
    {
        return await _db.Categories.AnyAsync(c =>
            c.Name == name && (!excludeId.HasValue || c.Id != excludeId.Value));
    }
}
