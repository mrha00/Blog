namespace BlogApi.Services.Helpers;

public static class UploadUrlValidator
{
    public static void ValidateOrThrow(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return;
        }

        var trimmed = url.Trim();

        if (trimmed.Contains("://", StringComparison.Ordinal))
        {
            throw new ArgumentException("图片地址仅允许本站 /uploads/ 路径");
        }

        if (!trimmed.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("图片地址仅允许本站 /uploads/ 路径");
        }

        if (trimmed.Contains("..", StringComparison.Ordinal))
        {
            throw new ArgumentException("图片地址无效");
        }

        var fileName = trimmed["/uploads/".Length..];
        if (string.IsNullOrEmpty(fileName) || fileName.Contains('/') || fileName.Contains('\\'))
        {
            throw new ArgumentException("图片地址无效");
        }
    }
}
