namespace BlogApi.API.DTOs.Posts;

public class PostQueryDto
{
    public string? Keyword { get; set; }
    public int? CategoryId { get; set; }
    public int? TagId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SortBy { get; set; } = "date";
    public bool Descending { get; set; } = true;
}
