using BlogApi.Core.Entities;

namespace BlogApi.Core.Interfaces;

public interface IRefreshTokenRepository
{
    Task<RefreshToken> AddAsync(RefreshToken token);
    Task<RefreshToken?> GetActiveByHashAsync(string tokenHash);
    Task RevokeAsync(RefreshToken token);
    Task RevokeAllForUserAsync(int userId);
}
