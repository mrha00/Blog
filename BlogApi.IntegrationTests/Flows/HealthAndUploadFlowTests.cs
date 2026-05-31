using System.Net;
using System.Net.Http.Headers;
using BlogApi.IntegrationTests.Helpers;

namespace BlogApi.IntegrationTests.Flows;

[Collection("Integration")]
public class HealthAndUploadFlowTests
{
    private readonly HttpClient _client;

    public HealthAndUploadFlowTests(BlogApiWebApplicationFactory factory)
    {
        factory.EnsureSeeded();
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Health_ReturnsHealthy()
    {
        var response = await _client.GetAsync("/health");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", body);
    }

    [Fact]
    public async Task GetNonexistentPost_Returns404()
    {
        var response = await _client.GetAsync("/api/posts/99999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Upload_WithoutToken_Returns401()
    {
        using var content = CreatePngUploadContent();
        var response = await _client.PostAsync("/api/upload", content);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Upload_WithToken_ReturnsUrl()
    {
        var token = await _client.LoginAndGetTokenAsync("admin", "123456");
        _client.SetBearerToken(token);

        using var content = CreatePngUploadContent();
        var response = await _client.PostAsync("/api/upload", content);
        response.EnsureSuccessStatusCode();

        var body = await HttpClientExtensions.ReadJsonAsync<UploadApiResponse>(response);
        Assert.Equal(200, body!.Code);
        Assert.StartsWith("/uploads/", body.Data!.Url);
    }

    private static MultipartFormDataContent CreatePngUploadContent()
    {
        var png = new byte[]
        {
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
            0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
            0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
            0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
            0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
            0x42, 0x60, 0x82
        };

        var fileContent = new ByteArrayContent(png);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        var form = new MultipartFormDataContent();
        form.Add(fileContent, "file", "test.png");
        return form;
    }

    private sealed class UploadApiResponse
    {
        public int Code { get; set; }
        public UploadData? Data { get; set; }
    }

    private sealed class UploadData
    {
        public string Url { get; set; } = string.Empty;
    }
}
