using BlogApi.Core.Models.Categories;

namespace BlogApi.Core.Interfaces;

public interface ICategoryService
{
    Task<List<CategoryItem>> GetAllAsync();
    Task<CategoryItem> CreateAsync(CreateCategoryRequest request);
    Task<CategoryItem> UpdateAsync(int id, UpdateCategoryRequest request);
    Task DeleteAsync(int id);
    Task<int> CleanupTestCategoriesAsync();
}
