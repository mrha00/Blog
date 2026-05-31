using System.ComponentModel.DataAnnotations;

namespace BlogApi.API.DTOs.Comments;

public class CreateCommentDto
{
    [Required]
    [MaxLength(2000)]
    public string Content { get; set; } = string.Empty;

    public int? ParentId { get; set; }
}

public class CommentDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public int UserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public int? ParentId { get; set; }
    public List<CommentDto> Replies { get; set; } = new();
}
