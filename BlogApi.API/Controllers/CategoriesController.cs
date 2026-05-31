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
    public async Task<ActionResult<List<CategoryDto>>> GetCategories()
    {
        var items = await _categoryService.GetAllAsync();
        return Ok(items.Select(MapToDto).ToList());
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPost]
    public async Task<ActionResult<CategoryDto>> CreateCategory(CreateCategoryDto dto)
    {
        var item = await _categoryService.CreateAsync(
            new CreateCategoryRequest(dto.Name, dto.Description));
        return CreatedAtAction(nameof(GetCategories), new { id = item.Id }, MapToDto(item));
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<CategoryDto>> UpdateCategory(int id, UpdateCategoryDto dto)
    {
        var item = await _categoryService.UpdateAsync(
            id, new UpdateCategoryRequest(dto.Name, dto.Description));
        return Ok(MapToDto(item));
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        await _categoryService.DeleteAsync(id);
        return NoContent();
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
