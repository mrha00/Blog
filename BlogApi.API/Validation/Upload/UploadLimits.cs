namespace BlogApi.API.Validation.Upload;

public static class UploadLimits
{
    public const long MaxBytes = 20 * 1024 * 1024;
    public const string MaxSizeLabel = "20MB";
}
