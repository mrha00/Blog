namespace BlogApi.Core.Models.Users;

public record PublicUserProfile(
    int Id,
    string Username,
    string Nickname,
    string? AvatarUrl,
    string? Bio,
    DateTime CreatedAt,
    int PublishedPostCount);
