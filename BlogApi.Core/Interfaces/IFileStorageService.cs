namespace BlogApi.Core.Interfaces;

public interface IFileStorageService
{
    Task<string> UploadAsync(Stream content, string extension, CancellationToken ct = default);

    /// <summary>Deletes a file under /uploads/ if it exists locally. Returns false for non-local URLs.</summary>
    bool TryDeleteUpload(string? url);
}
