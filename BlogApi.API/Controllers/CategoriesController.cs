using BlogApi.API.Common;
using BlogApi.API.DTOs.Categories;
using BlogApi.Core.Constants;
using BlogApi.Core.Interfaces;
using BlogApi.Core.Models.Categories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlogApi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<CategoryDto>>>> GetCategories()
    {
        var items = await _categoryService.GetAllAsync();
        return Ok(ApiResponse<List<CategoryDto>>.Success(items.Select(MapToDto).ToList()));
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> CreateCategory(CreateCategoryDto dto)
    {
        var item = await _categoryService.CreateAsync(
            new CreateCategoryRequest(dto.Name, dto.Description));
        return Ok(ApiResponse<CategoryDto>.Success(MapToDto(item), "分类已创建"));
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> UpdateCategory(int id, UpdateCategoryDto dto)
    {
        var item = await _categoryService.UpdateAsync(
            id, new UpdateCategoryRequest(dto.Name, dto.Description));
        return Ok(ApiResponse<CategoryDto>.Success(MapToDto(item), "分类已更新"));
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteCategory(int id)
    {
        await _categoryService.DeleteAsync(id);
        return Ok(ApiResponse<object>.Success(null!, "分类已删除"));
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpDelete("cleanup-test")]
    public async Task<ActionResult<ApiResponse<object>>> CleanupTestCategories()
    {
        var deleted = await _categoryService.CleanupTestCategoriesAsync();
        return Ok(ApiResponse<object>.Success(
            new { deleted },
            deleted > 0 ? $"已清理 {deleted} 个测试分类" : "没有需要清理的测试分类"));
    }

    private static CategoryDto MapToDto(CategoryItem item)
    {
        return new CategoryDto
        {
            Id = item.Id,
            Name = item.Name,
            Description = item.Description
        };
    }
}
