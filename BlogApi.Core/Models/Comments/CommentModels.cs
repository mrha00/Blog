namespace BlogApi.Core.Models.Comments;

public record CreateCommentRequest(string Content, int? ParentId);

public record CommentItem(
    int Id,
    string Content,
    string UserName,
    int UserId,
    DateTime CreatedAt,
    int? ParentId);

public class CommentTreeItem
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public int UserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public int? ParentId { get; set; }
    public List<CommentTreeItem> Replies { get; set; } = new();
}
