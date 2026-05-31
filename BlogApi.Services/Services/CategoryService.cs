using BlogApi.Core.Entities;
using BlogApi.Core.Exceptions;
using BlogApi.Core.Interfaces;
using BlogApi.Core.Models.Categories;

namespace BlogApi.Services.Services;

public class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _categoryRepository;

    public CategoryService(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<List<CategoryItem>> GetAllAsync()
    {
        var categories = await _categoryRepository.GetAllAsync();
        return categories.Select(c => new CategoryItem(c.Id, c.Name, c.Description)).ToList();
    }

    public async Task<CategoryItem> CreateAsync(CreateCategoryRequest request)
    {
        if (await _categoryRepository.NameExistsAsync(request.Name))
        {
            throw new InvalidOperationException("分类名已存在");
        }

        var category = new Category
        {
            Name = request.Name,
            Description = request.Description
        };

        category = await _categoryRepository.AddAsync(category);
        return new CategoryItem(category.Id, category.Name, category.Description);
    }

    public async Task<CategoryItem> UpdateAsync(int id, UpdateCategoryRequest request)
    {
        var category = await _categoryRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("分类不存在");

        if (await _categoryRepository.NameExistsAsync(request.Name, id))
        {
            throw new InvalidOperationException("分类名已存在");
        }

        category.Name = request.Name;
        category.Description = request.Description;

        await _categoryRepository.UpdateAsync(category);
        return new CategoryItem(category.Id, category.Name, category.Description);
    }

    public async Task DeleteAsync(int id)
    {
        var category = await _categoryRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("分类不存在");

        if (await _categoryRepository.HasPostsAsync(id))
        {
            throw new InvalidOperationException("该分类下存在文章，无法删除");
        }

        await _categoryRepository.DeleteAsync(category);
    }
}
