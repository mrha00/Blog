using System.ComponentModel.DataAnnotations;

namespace BlogApi.API.DTOs.Categories;

public class CreateCategoryDto
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
}

public class UpdateCategoryDto
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
}

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}
