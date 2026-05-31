using System.ComponentModel.DataAnnotations;

namespace BlogApi.API.DTOs.Tags;

public class CreateTagDto
{
    [Required]
    public string Name { get; set; } = string.Empty;
}

public class TagDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
