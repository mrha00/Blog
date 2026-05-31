namespace BlogApi.Core.Models.Posts;

public record PostQuery(
    string? Keyword,
    int? CategoryId,
    int? TagId,
    int Page = 1,
    int PageSize = 10,
    string? SortBy = "date",
    bool Descending = true,
    int? AuthorId = null);
