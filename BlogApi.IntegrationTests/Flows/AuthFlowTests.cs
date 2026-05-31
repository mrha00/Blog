using System.Net;
using System.Net.Http.Json;
using BlogApi.IntegrationTests.Helpers;

namespace BlogApi.IntegrationTests.Flows;

[Collection("Integration")]
public class AuthFlowTests
{
    private readonly HttpClient _client;

    public AuthFlowTests(BlogApiWebApplicationFactory factory)
    {
        factory.EnsureSeeded();
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_ReturnsToken()
    {
        var token = await _client.RegisterAndGetTokenAsync(
            $"user_{Guid.NewGuid():N}",
            $"user_{Guid.NewGuid():N}@test.local",
            "Test123!");

        Assert.False(string.IsNullOrWhiteSpace(token));
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        var token = await _client.LoginAndGetTokenAsync("admin", "123456");

        Assert.False(string.IsNullOrWhiteSpace(token));
    }

    [Fact]
    public async Task Login_WithInvalidPassword_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            username = "admin",
            password = "wrong-password"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_WithoutToken_Returns401()
    {
        _client.ClearBearerToken();
        var response = await _client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
