using System.ComponentModel.DataAnnotations;

namespace BlogApi.API.DTOs.Posts;

public class CreatePostDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    public string? Summary { get; set; }

    [Required]
    public int CategoryId { get; set; }

    public List<int> TagIds { get; set; } = new();

    public string? CoverUrl { get; set; }
}
