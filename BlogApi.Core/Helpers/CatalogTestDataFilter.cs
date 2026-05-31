using System.Text.RegularExpressions;

namespace BlogApi.Core.Helpers;

public static partial class CatalogTestDataFilter
{
    [GeneratedRegex(
        @"^(e2e|int)[-_]|^TechCat\d*$|^UniqueTag|^int-cat-|^int-tag-|^e2e-tag-|^e2e-cat-",
        RegexOptions.IgnoreCase)]
    private static partial Regex TestCatalogPattern();

    public static bool IsTestName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return true;
        }

        var trimmed = name.Trim();
        if (trimmed.All(c => c == '?'))
        {
            return true;
        }

        return TestCatalogPattern().IsMatch(trimmed);
    }
}
