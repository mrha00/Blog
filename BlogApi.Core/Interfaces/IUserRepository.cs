using BlogApi.Core.Entities;

namespace BlogApi.Core.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByEmailAsync(string email);
    Task<User> AddAsync(User user);
    Task<bool> ExistsByUsernameOrEmailAsync(string username, string email);
}
