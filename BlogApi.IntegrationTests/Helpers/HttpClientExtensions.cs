using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace BlogApi.IntegrationTests.Helpers;

public static class HttpClientExtensions
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public static void SetBearerToken(this HttpClient client, string token)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    public static void ClearBearerToken(this HttpClient client)
    {
        client.DefaultRequestHeaders.Authorization = null;
    }

    public static async Task<string> RegisterAndGetTokenAsync(
        this HttpClient client,
        string username,
        string email,
        string password)
    {
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            username,
            email,
            password
        });

        response.EnsureSuccessStatusCode();
        var body = await ReadJsonAsync<AuthTokenResponse>(response);
        return body!.Token;
    }

    public static async Task<string> LoginAndGetTokenAsync(
        this HttpClient client,
        string username,
        string password)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            username,
            password
        });

        response.EnsureSuccessStatusCode();
        var body = await ReadJsonAsync<AuthTokenResponse>(response);
        return body!.Token;
    }

    public static async Task<T?> ReadJsonAsync<T>(HttpResponseMessage response)
    {
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<T>(json, JsonOptions);
    }

    private sealed class AuthTokenResponse
    {
        public string Token { get; set; } = string.Empty;
    }
}
