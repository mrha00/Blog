using Microsoft.EntityFrameworkCore;

namespace BlogApi.Infrastructure.Data;

/// <summary>
/// Applies hand-written migrations that are not registered with EF designer metadata.
/// </summary>
public static class DbSchemaEnsurer
{
    private sealed record ManualMigration(string Id, Func<AppDbContext, Task> ApplyAsync);

    private static readonly ManualMigration[] Patches =
    [
        new("20260531120000_AddUserNickname", ApplyNicknameAsync),
        new("20260601120000_AddPostListIndexes", ApplyPostIndexesAsync),
        new("20260601140000_AddUserAvatarUrl", ApplyAvatarUrlAsync),
        new("20260601150000_AddPostSoftDelete", ApplyPostSoftDeleteAsync),
        new("20260601160000_AddRefreshTokens", ApplyRefreshTokensAsync),
        new("20260601170000_AddUserBio", ApplyUserBioAsync),
    ];

    public static async Task EnsureAsync(AppDbContext db)
    {
        await db.Database.MigrateAsync();

        foreach (var patch in Patches)
        {
            if (await IsMigrationAppliedAsync(db, patch.Id))
            {
                continue;
            }

            await patch.ApplyAsync(db);
            await MarkMigrationAppliedAsync(db, patch.Id);
        }
    }

    private static async Task ApplyNicknameAsync(AppDbContext db)
    {
        if (!await ColumnExistsAsync(db, "Users", "Nickname"))
        {
            await db.Database.ExecuteSqlRawAsync(
                "ALTER TABLE Users ADD COLUMN Nickname TEXT NOT NULL DEFAULT '';");
            await db.Database.ExecuteSqlRawAsync(
                "UPDATE Users SET Nickname = Username WHERE Nickname IS NULL OR Nickname = '';");
        }
    }

    private static async Task ApplyPostIndexesAsync(AppDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS IX_Posts_Status ON Posts (Status);");
        await db.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS IX_Posts_CreatedAt ON Posts (CreatedAt);");
    }

    private static async Task ApplyAvatarUrlAsync(AppDbContext db)
    {
        if (!await ColumnExistsAsync(db, "Users", "AvatarUrl"))
        {
            await db.Database.ExecuteSqlRawAsync(
                "ALTER TABLE Users ADD COLUMN AvatarUrl TEXT NULL;");
        }
    }

    private static async Task ApplyPostSoftDeleteAsync(AppDbContext db)
    {
        if (!await ColumnExistsAsync(db, "Posts", "IsDeleted"))
        {
            await db.Database.ExecuteSqlRawAsync(
                "ALTER TABLE Posts ADD COLUMN IsDeleted INTEGER NOT NULL DEFAULT 0;");
        }

        if (!await ColumnExistsAsync(db, "Posts", "DeletedAt"))
        {
            await db.Database.ExecuteSqlRawAsync(
                "ALTER TABLE Posts ADD COLUMN DeletedAt TEXT NULL;");
        }
    }

    private static async Task ApplyUserBioAsync(AppDbContext db)
    {
        if (!await ColumnExistsAsync(db, "Users", "Bio"))
        {
            await db.Database.ExecuteSqlRawAsync(
                "ALTER TABLE Users ADD COLUMN Bio TEXT NULL;");
        }
    }

    private static async Task ApplyRefreshTokensAsync(AppDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS RefreshTokens (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                TokenHash TEXT NOT NULL,
                UserId INTEGER NOT NULL,
                ExpiresAt TEXT NOT NULL,
                CreatedAt TEXT NOT NULL,
                RevokedAt TEXT NULL,
                FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
            );
            """);

        await db.Database.ExecuteSqlRawAsync(
            "CREATE INDEX IF NOT EXISTS IX_RefreshTokens_TokenHash ON RefreshTokens (TokenHash);");
    }

    private static async Task<bool> IsMigrationAppliedAsync(AppDbContext db, string migrationId)
    {
        await using var cmd = db.Database.GetDbConnection().CreateCommand();
        cmd.CommandText = "SELECT COUNT(*) FROM __EFMigrationsHistory WHERE MigrationId = $id;";
        AddParameter(cmd, "$id", migrationId);

        if (cmd.Connection!.State != System.Data.ConnectionState.Open)
        {
            await cmd.Connection.OpenAsync();
        }

        var count = Convert.ToInt32(await cmd.ExecuteScalarAsync());
        return count > 0;
    }

    private static async Task MarkMigrationAppliedAsync(AppDbContext db, string migrationId)
    {
        await db.Database.ExecuteSqlRawAsync(
            "INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ({0}, {1});",
            migrationId,
            "8.0.11");
    }

    private static async Task<bool> ColumnExistsAsync(AppDbContext db, string table, string column)
    {
        await using var cmd = db.Database.GetDbConnection().CreateCommand();
        cmd.CommandText = $"SELECT COUNT(*) FROM pragma_table_info('{table}') WHERE name = $name;";
        AddParameter(cmd, "$name", column);

        if (cmd.Connection!.State != System.Data.ConnectionState.Open)
        {
            await cmd.Connection.OpenAsync();
        }

        var count = Convert.ToInt32(await cmd.ExecuteScalarAsync());
        return count > 0;
    }

    private static void AddParameter(System.Data.Common.DbCommand cmd, string name, string value)
    {
        var parameter = cmd.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value;
        cmd.Parameters.Add(parameter);
    }
}
