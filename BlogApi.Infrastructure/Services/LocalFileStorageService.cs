using BlogApi.Core.Configuration;
using BlogApi.Core.Interfaces;
using Microsoft.Extensions.Options;

namespace BlogApi.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly FileStorageOptions _options;

    public LocalFileStorageService(IOptions<FileStorageOptions> options)
    {
        _options = options.Value;
    }

    public async Task<string> UploadAsync(Stream content, string extension, CancellationToken ct = default)
    {
        var normalizedExt = extension.StartsWith('.') ? extension.ToLowerInvariant() : $".{extension.ToLowerInvariant()}";
        Directory.CreateDirectory(_options.UploadRoot);

        var fileName = $"{Guid.NewGuid()}{normalizedExt}";
        var fullPath = Path.Combine(_options.UploadRoot, fileName);

        await using var fileStream = new FileStream(
            fullPath,
            FileMode.CreateNew,
            FileAccess.Write,
            FileShare.None,
            bufferSize: 4096,
            useAsync: true);

        await content.CopyToAsync(fileStream, ct);
        return $"/uploads/{fileName}";
    }

    public bool TryDeleteUpload(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return false;
        }

        var trimmed = url.Trim();
        if (!trimmed.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase)
            || trimmed.Contains("..", StringComparison.Ordinal))
        {
            return false;
        }

        var fileName = trimmed["/uploads/".Length..];
        if (string.IsNullOrEmpty(fileName) || fileName.Contains('/') || fileName.Contains('\\'))
        {
            return false;
        }

        var fullPath = Path.Combine(_options.UploadRoot, fileName);
        if (!File.Exists(fullPath))
        {
            return false;
        }

        File.Delete(fullPath);
        return true;
    }
}
