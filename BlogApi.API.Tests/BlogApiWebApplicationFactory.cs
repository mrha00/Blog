using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Hosting;

namespace BlogApi.API.Tests;

public class BlogApiWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        var testDbPath = Path.Combine(Path.GetTempPath(), $"blogapi-ci-{Guid.NewGuid():N}.db");

        // UseSetting overrides appsettings.json (empty Jwt:Key) before Program reads configuration.
        builder.UseSetting("ConnectionStrings:Default", $"Data Source={testDbPath}");
        builder.UseSetting("ConnectionStrings:Redis", "");
        builder.UseSetting("Jwt:Key", "BlogApi-CI-Secret-Key-At-Least-32-Chars!!");
        builder.UseSetting("Jwt:Issuer", "BlogApi");
        builder.UseSetting("Jwt:Audience", "BlogApi");
        builder.UseSetting("Jwt:ExpireMinutes", "60");
        builder.UseSetting("Jwt:RefreshExpireDays", "7");
    }
}
