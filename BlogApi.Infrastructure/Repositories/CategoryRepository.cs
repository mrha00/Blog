using BlogApi.Core.Entities;
using BlogApi.Core.Helpers;
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
        return await _db.Posts.IgnoreQueryFilters().AnyAsync(p => p.CategoryId == categoryId);
    }

    public async Task ReassignPostsAndDeleteAsync(Category category)
    {
        var fallback = await FindFallbackCategoryAsync()
            ?? throw new InvalidOperationException("没有可用的正式分类，请先创建分类");

        if (category.Id == fallback.Id)
        {
            throw new InvalidOperationException("无法删除默认分类");
        }

        await _db.Posts
            .IgnoreQueryFilters()
            .Where(p => p.CategoryId == category.Id)
            .ExecuteUpdateAsync(setters => setters.SetProperty(p => p.CategoryId, fallback.Id));

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
    }

    public async Task<int> DeleteTestCategoriesAsync()
    {
        var fallback = await FindFallbackCategoryAsync();
        if (fallback is null)
        {
            return 0;
        }

        var testIds = (await _db.Categories.ToListAsync())
            .Where(c => CatalogTestDataFilter.IsTestName(c.Name) && c.Id != fallback.Id)
            .Select(c => c.Id)
            .ToList();

        if (testIds.Count == 0)
        {
            return 0;
        }

        await _db.Posts
            .IgnoreQueryFilters()
            .Where(p => testIds.Contains(p.CategoryId))
            .ExecuteUpdateAsync(setters => setters.SetProperty(p => p.CategoryId, fallback.Id));

        return await _db.Categories
            .Where(c => testIds.Contains(c.Id))
            .ExecuteDeleteAsync();
    }

    private async Task<Category?> FindFallbackCategoryAsync()
    {
        var preferred = await _db.Categories.FirstOrDefaultAsync(c => c.Name == "技术分享");
        if (preferred is not null)
        {
            return preferred;
        }

        var all = await _db.Categories.ToListAsync();
        return all.FirstOrDefault(c => !CatalogTestDataFilter.IsTestName(c.Name));
    }

    public async Task<bool> NameExistsAsync(string name, int? excludeId = null)
    {
        return await _db.Categories.AnyAsync(c =>
            c.Name == name && (!excludeId.HasValue || c.Id != excludeId.Value));
    }
}
