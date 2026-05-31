using BlogApi.Core.Constants;
using BlogApi.Core.Entities;
using BlogApi.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BlogApi.IntegrationTests;

public class BlogApiWebApplicationFactory : WebApplicationFactory<Program>
{
    private const string IntegrationJwtKey = "Integration-Test-Jwt-Secret-32Chars!";

    private readonly string _dbPath = Path.Combine(
        Path.GetTempPath(),
        $"blogapi-integration-{Guid.NewGuid():N}.db");

    private bool _seeded;
    private readonly object _seedLock = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "IntegrationTests");
        Environment.SetEnvironmentVariable("ConnectionStrings__Default", $"Data Source={_dbPath}");
        Environment.SetEnvironmentVariable("ConnectionStrings__Redis", string.Empty);
        Environment.SetEnvironmentVariable("Jwt__Key", IntegrationJwtKey);
        Environment.SetEnvironmentVariable("Jwt__Issuer", "BlogApi");
        Environment.SetEnvironmentVariable("Jwt__Audience", "BlogApi");
        Environment.SetEnvironmentVariable("Jwt__ExpireMinutes", "60");

        builder.UseEnvironment("IntegrationTests");
    }

    public void EnsureSeeded()
    {
        lock (_seedLock)
        {
            if (_seeded)
            {
                return;
            }

            using var scope = Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.Migrate();

            if (!db.Users.Any(u => u.Username == "admin"))
            {
                db.Users.Add(new User
                {
                    Username = "admin",
                    Email = "admin@test.local",
                    PasswordHash = "$2a$11$L.vSYr5k3GDmSXgPc/xcHOl8cgBcovdeGavg29YkX93d5wQukyNHa",
                    Role = Roles.Admin,
                    CreatedAt = DateTime.UtcNow
                });
                db.SaveChanges();
            }

            _seeded = true;
        }
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            TryDeleteDb();
        }

        base.Dispose(disposing);
    }

    private void TryDeleteDb()
    {
        SqliteConnection.ClearAllPools();

        foreach (var suffix in new[] { "", "-wal", "-shm" })
        {
            var path = _dbPath + suffix;
            if (!File.Exists(path))
            {
                continue;
            }

            try
            {
                File.Delete(path);
            }
            catch (IOException)
            {
            }
        }
    }
}
