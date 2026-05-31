using System.Text.RegularExpressions;
using BlogApi.Core.Interfaces;

namespace BlogApi.Services.Helpers;

public static class SlugHelper
{
    public static string GenerateSlug(string title)
    {
        var slug = title.ToLowerInvariant().Trim();
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = Regex.Replace(slug, @"[^a-z0-9\-]", string.Empty);
        slug = Regex.Replace(slug, @"-+", "-").Trim('-');
        return string.IsNullOrEmpty(slug) ? "post" : slug;
    }

    public static async Task<string> EnsureUniqueSlugAsync(
        string baseSlug,
        IPostRepository postRepository,
        int? excludePostId = null)
    {
        var slug = baseSlug;
        var suffix = 2;

        while (await postRepository.SlugExistsAsync(slug, excludePostId))
        {
            slug = $"{baseSlug}-{suffix}";
            suffix++;
        }

        return slug;
    }
}
