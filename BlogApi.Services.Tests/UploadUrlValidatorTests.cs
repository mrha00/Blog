using BlogApi.Services.Helpers;
using Xunit;

namespace BlogApi.Services.Tests;

public class UploadUrlValidatorTests
{
    [Fact]
    public void ValidateOrThrow_AllowsNullOrEmpty()
    {
        UploadUrlValidator.ValidateOrThrow(null);
        UploadUrlValidator.ValidateOrThrow("");
        UploadUrlValidator.ValidateOrThrow("   ");
    }

    [Fact]
    public void ValidateOrThrow_AllowsLocalUploadPath()
    {
        UploadUrlValidator.ValidateOrThrow("/uploads/cover-abc.png");
    }

    [Theory]
    [InlineData("https://evil.example/x.png")]
    [InlineData("/images/x.png")]
    [InlineData("/uploads/../secret.png")]
    [InlineData("/uploads/nested/file.png")]
    public void ValidateOrThrow_RejectsInvalidUrls(string url)
    {
        Assert.Throws<ArgumentException>(() => UploadUrlValidator.ValidateOrThrow(url));
    }
}
