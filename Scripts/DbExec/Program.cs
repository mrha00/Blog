using Microsoft.Data.Sqlite;

if (args.Length < 2)
{
    Console.Error.WriteLine("Usage: DbExec <db-path> <sql-file>");
    return 1;
}

var dbPath = Path.GetFullPath(args[0]);
var sqlPath = Path.GetFullPath(args[1]);

if (!File.Exists(dbPath))
{
    Console.Error.WriteLine($"Database not found: {dbPath}");
    return 1;
}

if (!File.Exists(sqlPath))
{
    Console.Error.WriteLine($"SQL file not found: {sqlPath}");
    return 1;
}

var sql = File.ReadAllText(sqlPath);
using var connection = new SqliteConnection($"Data Source={dbPath}");
await connection.OpenAsync();

foreach (var statement in sql.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
{
    var executable = StripLineComments(statement);
    if (string.IsNullOrWhiteSpace(executable))
    {
        continue;
    }

    await using var command = connection.CreateCommand();
    command.CommandText = executable;
    await command.ExecuteNonQueryAsync();
}

Console.WriteLine($"Applied: {sqlPath} -> {dbPath}");
return 0;

static string StripLineComments(string sql)
{
    var lines = sql.Split('\n')
        .Where(line => !line.TrimStart().StartsWith("--"));
    return string.Join('\n', lines).Trim();
}
