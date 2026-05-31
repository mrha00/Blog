using System.Text.Json;
using BlogApi.Core.Models.Posts;
using Microsoft.Extensions.Caching.Distributed;

namespace BlogApi.Services.Services;

public class PostCacheService
{
    private const string NotFoundMarker = "NULL";
    private static readonly TimeSpan DetailTtl = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan NotFoundTtl = TimeSpan.FromMinutes(5);
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly IDistributedCache _cache;

    public PostCacheService(IDistributedCache cache)
    {
        _cache = cache;
    }

    public async Task<PostDetailItem?> GetAsync(int id)
    {
        var cached = await _cache.GetStringAsync(GetDetailKey(id));
        if (string.IsNullOrEmpty(cached) || cached == NotFoundMarker)
        {
            return null;
        }

        return JsonSerializer.Deserialize<PostDetailItem>(cached, JsonOptions);
    }

    public async Task<bool> IsNotFoundAsync(int id)
    {
        var cached = await _cache.GetStringAsync(GetDetailKey(id));
        return cached == NotFoundMarker;
    }

    public async Task SetAsync(int id, PostDetailItem item)
    {
        var json = JsonSerializer.Serialize(item, JsonOptions);
        await _cache.SetStringAsync(
            GetDetailKey(id),
            json,
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = DetailTtl
            });
    }

    public async Task SetNotFoundAsync(int id)
    {
        await _cache.SetStringAsync(
            GetDetailKey(id),
            NotFoundMarker,
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = NotFoundTtl
            });
    }

    public Task InvalidateAsync(int id)
    {
        return _cache.RemoveAsync(GetDetailKey(id));
    }

    private static string GetDetailKey(int id) => $"post:{id}";
}
