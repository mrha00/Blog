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
        ("产品与设计", "产品设计、用户体验与交互"),
        ("学习笔记", "读书、课程与自学记录"),
        ("生活随笔", "日常思考与生活感悟"),
        ("问答讨论", "问题求助与经验交流"),
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
        await CleanupOrphanTestCatalogAsync(db);
    }

    private static async Task CleanupOrphanTestCatalogAsync(AppDbContext db)
    {
        var orphanTestCategories = await db.Categories
            .Where(c => !db.Posts.Any(p => p.CategoryId == c.Id))
            .ToListAsync();

        foreach (var category in orphanTestCategories.Where(c => CatalogTestDataFilter.IsTestName(c.Name)))
        {
            db.Categories.Remove(category);
        }

        var orphanTestTags = await db.Tags
            .Where(t => !t.Posts.Any())
            .ToListAsync();

        foreach (var tag in orphanTestTags.Where(t => CatalogTestDataFilter.IsTestName(t.Name)))
        {
            db.Tags.Remove(tag);
        }

        await db.SaveChangesAsync();
    }
}
