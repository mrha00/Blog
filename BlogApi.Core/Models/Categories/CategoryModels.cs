namespace BlogApi.Core.Models.Categories;

public record CreateCategoryRequest(string Name, string? Description);

public record UpdateCategoryRequest(string Name, string? Description);

public record CategoryItem(int Id, string Name, string? Description);
