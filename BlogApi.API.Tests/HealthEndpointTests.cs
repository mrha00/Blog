using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace BlogApi.API.Tests;

public class HealthEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public HealthEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Health_ReturnsOk()
    {
        var response = await _client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Tags_List_IsPublic()
    {
        var response = await _client.GetAsync("/api/tags");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
