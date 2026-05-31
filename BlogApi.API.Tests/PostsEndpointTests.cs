using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace BlogApi.API.Tests;

public class PostsEndpointTests : IClassFixture<BlogApiWebApplicationFactory>
{
    private readonly HttpClient _client;

    public PostsEndpointTests(BlogApiWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetPosts_IsPublic()
    {
        var response = await _client.GetAsync("/api/posts?page=1&pageSize=5");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CreatePost_WithoutAuth_ReturnsUnauthorized()
    {
        var response = await _client.PostAsJsonAsync("/api/posts", new
        {
            title = "unauthorized",
            content = "body",
            categoryId = 1,
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreatePost_WithAuth_ReturnsOk()
    {
        var token = await LoginAsAdminAsync();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/posts");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new
        {
            title = $"integration-{Guid.NewGuid():N}"[..20],
            content = "integration test body",
            summary = "summary",
            categoryId = 1,
            tagIds = Array.Empty<int>(),
        });

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private async Task<string> LoginAsAdminAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            username = "admin",
            password = "123456",
        });

        response.EnsureSuccessStatusCode();
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("data").GetProperty("token").GetString()!;
    }
}
