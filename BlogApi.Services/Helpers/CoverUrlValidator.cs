namespace BlogApi.Services.Helpers;

public static class CoverUrlValidator
{
    public static void ValidateOrThrow(string? coverUrl) => UploadUrlValidator.ValidateOrThrow(coverUrl);
}
