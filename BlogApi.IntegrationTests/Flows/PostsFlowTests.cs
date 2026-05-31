using System.Net;
using System.Net.Http.Json;
using BlogApi.IntegrationTests.Helpers;

namespace BlogApi.IntegrationTests.Flows;

[Collection("Integration")]
public class PostsFlowTests
{
    private readonly HttpClient _client;

    public PostsFlowTests(BlogApiWebApplicationFactory factory)
    {
        factory.EnsureSeeded();
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task DraftPost_IsExcludedFromPublicList()
    {
        var adminToken = await _client.LoginAndGetTokenAsync("admin", "123456");
        var userToken = await _client.RegisterAndGetTokenAsync(
            $"author_{Guid.NewGuid():N}",
            $"author_{Guid.NewGuid():N}@test.local",
            "Test123!");

        _client.SetBearerToken(adminToken);
        var category = await _client.PostAsJsonAsync("/api/categories", new
        {
            name = $"Cat_{Guid.NewGuid():N}",
            description = "integration"
        });
        category.EnsureSuccessStatusCode();
        var categoryBody = await HttpClientExtensions.ReadJsonAsync<CategoryResponse>(category);

        _client.SetBearerToken(userToken);
        var create = await _client.PostAsJsonAsync("/api/posts", new
        {
            title = $"Draft_{Guid.NewGuid():N}",
            content = "content",
            summary = "summary",
            categoryId = categoryBody!.Id,
            tagIds = Array.Empty<int>()
        });
        create.EnsureSuccessStatusCode();
        var post = await HttpClientExtensions.ReadJsonAsync<PostDetailResponse>(create);

        _client.ClearBearerToken();
        var list = await _client.GetAsync("/api/posts?page=1&pageSize=50");
        list.EnsureSuccessStatusCode();
        var paged = await HttpClientExtensions.ReadJsonAsync<PagedPostsResponse>(list);

        Assert.DoesNotContain(paged!.Items, item => item.Id == post!.Id);
    }

    [Fact]
    public async Task PublishedPost_AppearsInPublicList()
    {
        var adminToken = await _client.LoginAndGetTokenAsync("admin", "123456");
        var userToken = await _client.RegisterAndGetTokenAsync(
            $"author_{Guid.NewGuid():N}",
            $"author_{Guid.NewGuid():N}@test.local",
            "Test123!");

        var postId = await CreatePublishedPostAsync(adminToken, userToken);

        _client.ClearBearerToken();
        var list = await _client.GetAsync("/api/posts?page=1&pageSize=50");
        list.EnsureSuccessStatusCode();
        var paged = await HttpClientExtensions.ReadJsonAsync<PagedPostsResponse>(list);

        Assert.Contains(paged!.Items, item => item.Id == postId);
    }

    [Fact]
    public async Task UserCannotUpdateOthersPost_Returns403()
    {
        var adminToken = await _client.LoginAndGetTokenAsync("admin", "123456");
        var userAToken = await _client.RegisterAndGetTokenAsync(
            $"userA_{Guid.NewGuid():N}",
            $"userA_{Guid.NewGuid():N}@test.local",
            "Test123!");
        var userBToken = await _client.RegisterAndGetTokenAsync(
            $"userB_{Guid.NewGuid():N}",
            $"userB_{Guid.NewGuid():N}@test.local",
            "Test123!");

        var postId = await CreatePublishedPostAsync(adminToken, userAToken);

        _client.SetBearerToken(userBToken);
        var response = await _client.PutAsJsonAsync($"/api/posts/{postId}", new
        {
            title = "Hacked",
            content = "x",
            summary = "x",
            categoryId = 1,
            tagIds = Array.Empty<int>()
        });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task UserCannotCreateCategory_Returns403()
    {
        var userToken = await _client.RegisterAndGetTokenAsync(
            $"user_{Guid.NewGuid():N}",
            $"user_{Guid.NewGuid():N}@test.local",
            "Test123!");

        _client.SetBearerToken(userToken);
        var response = await _client.PostAsJsonAsync("/api/categories", new
        {
            name = $"Denied_{Guid.NewGuid():N}",
            description = "x"
        });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private async Task<int> CreatePublishedPostAsync(string adminToken, string userToken)
    {
        _client.SetBearerToken(adminToken);
        var category = await _client.PostAsJsonAsync("/api/categories", new
        {
            name = $"Cat_{Guid.NewGuid():N}",
            description = "integration"
        });
        category.EnsureSuccessStatusCode();
        var categoryBody = await HttpClientExtensions.ReadJsonAsync<CategoryResponse>(category);

        _client.SetBearerToken(userToken);
        var create = await _client.PostAsJsonAsync("/api/posts", new
        {
            title = $"Post_{Guid.NewGuid():N}",
            content = "content",
            summary = "summary",
            categoryId = categoryBody!.Id,
            tagIds = Array.Empty<int>()
        });
        create.EnsureSuccessStatusCode();
        var post = await HttpClientExtensions.ReadJsonAsync<PostDetailResponse>(create);

        var publish = await _client.PostAsync($"/api/posts/{post!.Id}/publish", null);
        publish.EnsureSuccessStatusCode();
        return post.Id;
    }

    private sealed class CategoryResponse
    {
        public int Id { get; set; }
    }

    private sealed class PostDetailResponse
    {
        public int Id { get; set; }
    }

    private sealed class PagedPostsResponse
    {
        public List<PostListItem> Items { get; set; } = new();
    }

    private sealed class PostListItem
    {
        public int Id { get; set; }
    }
}
