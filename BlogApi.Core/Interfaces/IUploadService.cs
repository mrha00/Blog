namespace BlogApi.Core.Interfaces;

public interface IUploadService
{
    Task<string> UploadAsync(Stream content, string extension, CancellationToken ct = default);
}
