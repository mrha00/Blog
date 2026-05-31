namespace BlogApi.Core.Models.Posts;

public record CreatePostRequest(
    string Title,
    string Content,
    string? Summary,
    int CategoryId,
    List<int> TagIds,
    string? CoverUrl);

public record UpdatePostRequest(
    string Title,
    string Content,
    string? Summary,
    int CategoryId,
    List<int> TagIds,
    string? CoverUrl);

public record PostListItem(
    int Id,
    string Title,
    string Summary,
    string CategoryName,
    List<string> Tags,
    int AuthorId,
    string AuthorName,
    Enums.PostStatus Status,
    DateTime CreatedAt,
    string? CoverUrl);

public record PostDetailItem(
    int Id,
    string Title,
    string Content,
    string? Summary,
    string? CoverUrl,
    string? Slug,
    Enums.PostStatus Status,
    string CategoryName,
    List<string> Tags,
    int AuthorId,
    string AuthorName,
    int ViewCount,
    DateTime CreatedAt,
    DateTime? PublishedAt);
