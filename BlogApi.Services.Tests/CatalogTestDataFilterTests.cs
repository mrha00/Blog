using BlogApi.Core.Helpers;
using Xunit;

namespace BlogApi.Services.Tests;

public class CatalogTestDataFilterTests
{
    [Theory]
    [InlineData("e2e-cat-123")]
    [InlineData("int-tag-abc")]
    [InlineData("TechCat99")]
    [InlineData("UniqueTag")]
    [InlineData("????")]
    public void IsTestName_DetectsTestCatalogNames(string name)
    {
        Assert.True(CatalogTestDataFilter.IsTestName(name));
    }

    [Theory]
    [InlineData("技术分享")]
    [InlineData("React")]
    [InlineData("生活随笔")]
    public void IsTestName_AllowsProductionNames(string name)
    {
        Assert.False(CatalogTestDataFilter.IsTestName(name));
    }
}
