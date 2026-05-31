using System.Text.Json;
using BlogApi.Core.Common;
using BlogApi.Core.Models.Posts;
using Microsoft.Extensions.Caching.Distributed;

namespace BlogApi.Services.Services;

public class PostListCacheService
{
    private const string VersionKey = "postlist:version";
    private static readonly TimeSpan ListTtl = TimeSpan.FromMinutes(3);
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly IDistributedCache _cache;

    public PostListCacheService(IDistributedCache cache)
    {
        _cache = cache;
    }

    public async Task<PagedResult<PostListItem>?> GetAsync(PostQuery query)
    {
        var version = await GetVersionAsync();
        var key = BuildKey(query, version);
        var cached = await _cache.GetStringAsync(key);
        if (string.IsNullOrEmpty(cached))
        {
            return null;
        }

        return JsonSerializer.Deserialize<PagedResult<PostListItem>>(cached, JsonOptions);
    }

    public async Task SetAsync(PostQuery query, PagedResult<PostListItem> result)
    {
        var version = await GetVersionAsync();
        var key = BuildKey(query, version);
        var json = JsonSerializer.Serialize(result, JsonOptions);
        await _cache.SetStringAsync(
            key,
            json,
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = ListTtl
            });
    }

    public async Task InvalidateAsync()
    {
        await _cache.SetStringAsync(
            VersionKey,
            Guid.NewGuid().ToString("N"),
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(1)
            });
    }

    private async Task<string> GetVersionAsync()
    {
        var version = await _cache.GetStringAsync(VersionKey);
        if (!string.IsNullOrEmpty(version))
        {
            return version;
        }

        version = "0";
        await _cache.SetStringAsync(
            VersionKey,
            version,
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(1)
            });
        return version;
    }

    private static string BuildKey(PostQuery query, string version)
    {
        return string.Join(':',
            "postlist",
            version,
            query.AuthorId?.ToString() ?? "all",
            query.Keyword ?? string.Empty,
            query.CategoryId?.ToString() ?? string.Empty,
            query.TagId?.ToString() ?? string.Empty,
            query.Page,
            query.PageSize,
            query.SortBy ?? "date",
            query.Descending);
    }
}
