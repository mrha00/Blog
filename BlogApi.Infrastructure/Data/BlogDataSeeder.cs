using BlogApi.Core.Constants;
using BlogApi.Core.Entities;
using BlogApi.Core.Helpers;
using Microsoft.EntityFrameworkCore;

namespace BlogApi.Infrastructure.Data;

public static class BlogDataSeeder
{
    private const string DemoPasswordHash =
        "$2a$11$L.vSYr5k3GDmSXgPc/xcHOl8cgBcovdeGavg29YkX93d5wQukyNHa";

    private static readonly (string Name, string Description)[] DefaultCategories =
    [
        ("技术分享", "编程语言、框架与工程实践"),
        ("前端工程", "组件化、样式体系与交互体验"),
        ("后端架构", "API 设计、服务拆分与领域建模"),
        ("数据库", "SQL、ORM 与数据建模"),
        ("运维部署", "Docker、CI/CD 与监控告警"),
        ("产品与设计", "产品设计、用户体验与交互"),
        ("开源见闻", "工具库、社区动态与技术选型"),
        ("学习笔记", "读书、课程与自学记录"),
        ("职场成长", "协作沟通、写作表达与软技能"),
        ("生活随笔", "日常思考与生活感悟"),
        ("问答讨论", "问题求助与经验交流"),
    ];

    private static readonly string[] DefaultTags =
    [
        "ASP.NET Core",
        "Entity Framework",
        "React",
        "前端开发",
        "后端",
        "Docker",
        "性能优化",
        "教程",
        "心得体会",
        "开源项目",
        "SQLite",
        "Redis",
        "Markdown",
        "全栈",
    ];

    private static readonly (string Username, string Nickname, string Email, string Role)[] DemoUsers =
    [
        ("admin", "博客管理员", "admin@blog.local", Roles.Admin),
        ("alice", "爱丽丝", "alice@blog.local", Roles.User),
        ("bob", "小明", "bob@blog.local", Roles.User),
    ];

    private static readonly (string Username, string Nickname)[] DemoNicknames =
    [
        ("admin", "博客管理员"),
        ("alice", "爱丽丝"),
        ("bob", "小明"),
    ];

    public static async Task SeedAsync(AppDbContext db)
    {
        foreach (var (name, description) in DefaultCategories)
        {
            if (!await db.Categories.AnyAsync(c => c.Name == name))
            {
                db.Categories.Add(new Category { Name = name, Description = description });
            }
        }

        foreach (var (username, nickname, email, role) in DemoUsers)
        {
            if (!await db.Users.AnyAsync(u => u.Username == username))
            {
                db.Users.Add(new User
                {
                    Username = username,
                    Nickname = nickname,
                    Email = email,
                    PasswordHash = DemoPasswordHash,
                    Role = role,
                    CreatedAt = DateTime.UtcNow,
                });
            }
        }

        foreach (var (username, nickname) in DemoNicknames)
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user is not null && string.IsNullOrWhiteSpace(user.Nickname))
            {
                user.Nickname = nickname;
            }
        }

        var usersWithoutNickname = await db.Users
            .Where(u => u.Nickname == null || u.Nickname == string.Empty)
            .ToListAsync();

        foreach (var user in usersWithoutNickname)
        {
            user.Nickname = user.Username;
        }

        await db.SaveChangesAsync();
        await CleanupTestCatalogAsync(db);
        await SeedDefaultTagsAsync(db);
    }

    private static async Task SeedDefaultTagsAsync(AppDbContext db)
    {
        foreach (var name in DefaultTags)
        {
            if (!await db.Tags.AnyAsync(t => t.Name == name))
            {
                db.Tags.Add(new Tag { Name = name });
            }
        }

        await db.SaveChangesAsync();
    }

    private static async Task CleanupTestCatalogAsync(AppDbContext db)
    {
        var fallbackCategory = await db.Categories.FirstOrDefaultAsync(c => c.Name == "技术分享")
            ?? (await db.Categories.ToListAsync())
                .FirstOrDefault(c => !CatalogTestDataFilter.IsTestName(c.Name));

        if (fallbackCategory is not null)
        {
            var testCategoryIds = (await db.Categories.ToListAsync())
                .Where(c => CatalogTestDataFilter.IsTestName(c.Name) && c.Id != fallbackCategory.Id)
                .Select(c => c.Id)
                .ToList();

            if (testCategoryIds.Count > 0)
            {
                await db.Posts
                    .IgnoreQueryFilters()
                    .Where(p => testCategoryIds.Contains(p.CategoryId))
                    .ExecuteUpdateAsync(setters => setters.SetProperty(p => p.CategoryId, fallbackCategory.Id));

                await db.Categories
                    .Where(c => testCategoryIds.Contains(c.Id))
                    .ExecuteDeleteAsync();
            }
        }

        var testTagIds = (await db.Tags.ToListAsync())
            .Where(t => CatalogTestDataFilter.IsTestName(t.Name))
            .Select(t => t.Id)
            .ToList();

        if (testTagIds.Count == 0)
        {
            return;
        }

        await db.Database.ExecuteSqlRawAsync(
            $"DELETE FROM \"PostTags\" WHERE \"TagsId\" IN ({string.Join(",", testTagIds)})");

        await db.Tags
            .Where(t => testTagIds.Contains(t.Id))
            .ExecuteDeleteAsync();
    }
}
