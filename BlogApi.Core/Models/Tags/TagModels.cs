namespace BlogApi.Core.Models.Tags;

public record CreateTagRequest(string Name);

public record TagItem(int Id, string Name);
