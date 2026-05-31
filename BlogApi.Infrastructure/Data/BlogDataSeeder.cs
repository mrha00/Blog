using BlogApi.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace BlogApi.Infrastructure.Data;

public static class BlogDataSeeder
{
    private static readonly (string Name, string Description)[] DefaultCategories =
    [
        ("技术分享", "编程语言、框架与工程实践"),
        ("产品与设计", "产品设计、用户体验与交互"),
        ("学习笔记", "读书、课程与自学记录"),
        ("生活随笔", "日常思考与生活感悟"),
        ("问答讨论", "问题求助与经验交流"),
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
    }
}
