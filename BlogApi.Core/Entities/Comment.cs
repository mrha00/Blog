namespace BlogApi.Core.Entities;

public class Comment
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int PostId { get; set; }
    public int UserId { get; set; }
    public int? ParentId { get; set; }

    public Post Post { get; set; } = null!;
    public User User { get; set; } = null!;
    public Comment? Parent { get; set; }
    public ICollection<Comment> Replies { get; set; } = new List<Comment>();
}
