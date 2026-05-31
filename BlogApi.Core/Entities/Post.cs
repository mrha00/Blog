using BlogApi.Core.Enums;

namespace BlogApi.Core.Entities;

public class Post
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string? CoverUrl { get; set; }
    public string? Slug { get; set; }
    public PostStatus Status { get; set; } = PostStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public int ViewCount { get; set; }
    public string? RejectionReason { get; set; }
    public int AuthorId { get; set; }
    public int CategoryId { get; set; }

    public User Author { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public ICollection<Tag> Tags { get; set; } = new List<Tag>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}
