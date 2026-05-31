using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace BlogApi.API.Tests;

public class AuthEndpointTests : IClassFixture<BlogApiWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthEndpointTests(BlogApiWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_WithDemoUser_ReturnsTokens()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            username = "admin",
            password = "123456",
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.True(doc.RootElement.GetProperty("data").TryGetProperty("token", out _));
        Assert.True(doc.RootElement.GetProperty("data").TryGetProperty("refreshToken", out _));
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            username = "admin",
            password = "wrong-password",
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Register_ThenLogin_Succeeds()
    {
        var username = $"user_{Guid.NewGuid():N}"[..12];
        var register = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            username,
            email = $"{username}@example.com",
            password = "123456",
            nickname = "测试用户",
        });

        Assert.Equal(HttpStatusCode.OK, register.StatusCode);

        var login = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            username,
            password = "123456",
        });

        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
    }
}
