namespace BlogApi.Core.Interfaces;

public interface IFileStorageService
{
    Task<string> UploadAsync(Stream content, string extension, CancellationToken ct = default);
}
