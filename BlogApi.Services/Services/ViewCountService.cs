using BlogApi.Core.Interfaces;
using Microsoft.Extensions.Caching.Distributed;

namespace BlogApi.Services.Services;

public class ViewCountService
{
    private readonly IDistributedCache _cache;
    private readonly IPostRepository _postRepository;

    public ViewCountService(IDistributedCache cache, IPostRepository postRepository)
    {
        _cache = cache;
        _postRepository = postRepository;
    }

    public async Task IncrementViewCountAsync(int postId, string clientIp)
    {
        var cacheKey = $"view:{postId}:{clientIp}";
        var existing = await _cache.GetStringAsync(cacheKey);
        if (existing is not null)
        {
            return;
        }

        await _cache.SetStringAsync(
            cacheKey,
            "1",
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1)
            });

        await _postRepository.IncrementViewCountAsync(postId);
    }
}
