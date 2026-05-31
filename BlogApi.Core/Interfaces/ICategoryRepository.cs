using BlogApi.Core.Entities;

namespace BlogApi.Core.Interfaces;

public interface ICategoryRepository
{
    Task<Category?> GetByIdAsync(int id);
    Task<List<Category>> GetAllAsync();
    Task<Category> AddAsync(Category category);
    Task UpdateAsync(Category category);
    Task DeleteAsync(Category category);
    Task<bool> HasPostsAsync(int categoryId);
    Task<bool> NameExistsAsync(string name, int? excludeId = null);
    Task ReassignPostsAndDeleteAsync(Category category);
    Task<int> DeleteTestCategoriesAsync();
}
