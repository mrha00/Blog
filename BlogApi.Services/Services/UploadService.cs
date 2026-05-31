using BlogApi.Core.Interfaces;

namespace BlogApi.Services.Services;

public class UploadService : IUploadService
{
    private readonly IFileStorageService _fileStorage;

    public UploadService(IFileStorageService fileStorage)
    {
        _fileStorage = fileStorage;
    }

    public Task<string> UploadAsync(Stream content, string extension, CancellationToken ct = default)
    {
        return _fileStorage.UploadAsync(content, extension, ct);
    }
}
