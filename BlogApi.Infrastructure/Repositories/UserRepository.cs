using BlogApi.Core.Entities;
using BlogApi.Core.Enums;
using BlogApi.Core.Interfaces;
using BlogApi.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BlogApi.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;

    public UserRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<User?> GetByIdAsync(int id)
    {
        return await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        return await _db.Users.FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User> AddAsync(User user)
    {
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }

    public async Task<User> UpdateAsync(User user)
    {
        _db.Users.Update(user);
        await _db.SaveChangesAsync();
        return user;
    }

    public async Task<bool> ExistsByUsernameOrEmailAsync(string username, string email)
    {
        return await _db.Users.AnyAsync(u => u.Username == username || u.Email == email);
    }

    public async Task<int> CountPublishedPostsAsync(int userId)
    {
        return await _db.Posts.CountAsync(p =>
            p.AuthorId == userId && p.Status == PostStatus.Published);
    }
}
