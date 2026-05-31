namespace BlogApi.Services.Helpers;

public static class CoverUrlValidator
{
    public static void ValidateOrThrow(string? coverUrl)
    {
        if (string.IsNullOrWhiteSpace(coverUrl))
        {
            return;
        }

        var trimmed = coverUrl.Trim();

        if (trimmed.Contains("://", StringComparison.Ordinal))
        {
            throw new ArgumentException("封面地址仅允许本站 /uploads/ 路径");
        }

        if (!trimmed.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("封面地址仅允许本站 /uploads/ 路径");
        }

        if (trimmed.Contains("..", StringComparison.Ordinal))
        {
            throw new ArgumentException("封面地址无效");
        }

        var fileName = trimmed["/uploads/".Length..];
        if (string.IsNullOrEmpty(fileName) || fileName.Contains('/') || fileName.Contains('\\'))
        {
            throw new ArgumentException("封面地址无效");
        }
    }
}
