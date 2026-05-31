using BlogApi.API.Common;

namespace BlogApi.API.Validation.Upload;

public static class UploadValidation
{
    private const long MaxBytes = 5 * 1024 * 1024;
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png"
    };

    public static List<ValidationErrorItem> Validate(IFormFile? file)
    {
        var errors = new List<ValidationErrorItem>();

        if (file is null || file.Length == 0)
        {
            errors.Add(new ValidationErrorItem
            {
                Field = "file",
                Message = "请选择要上传的文件"
            });
            return errors;
        }

        if (file.Length > MaxBytes)
        {
            errors.Add(new ValidationErrorItem
            {
                Field = "file",
                Message = "文件大小不能超过 5MB"
            });
        }

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
        {
            errors.Add(new ValidationErrorItem
            {
                Field = "file",
                Message = "仅支持 jpg、jpeg、png 格式"
            });
            return errors;
        }

        if (!HasValidMagicNumber(file, extension))
        {
            errors.Add(new ValidationErrorItem
            {
                Field = "file",
                Message = "文件内容与扩展名不匹配"
            });
        }

        return errors;
    }

    private static bool HasValidMagicNumber(IFormFile file, string extension)
    {
        Span<byte> header = stackalloc byte[8];
        using var stream = file.OpenReadStream();
        var read = stream.Read(header);
        if (read < 3)
        {
            return false;
        }

        if (extension.Equals(".png", StringComparison.OrdinalIgnoreCase))
        {
            ReadOnlySpan<byte> pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
            return read >= 8 && header[..8].SequenceEqual(pngSignature);
        }

        return header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF;
    }
}
