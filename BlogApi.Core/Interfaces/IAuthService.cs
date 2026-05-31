using BlogApi.Core.Models.Auth;

namespace BlogApi.Core.Interfaces;

public interface IAuthService
{
    Task<AuthTokenResult> RegisterAsync(RegisterRequest request);
    Task<AuthTokenResult> LoginAsync(LoginRequest request);
    Task<AuthTokenResult> RefreshAsync(string refreshToken);
    Task RevokeRefreshTokenAsync(string refreshToken);
    Task<UserProfile> GetProfileAsync(int userId);
    Task<UserProfile> UpdateProfileAsync(int userId, UpdateProfileRequest request);
    Task ChangePasswordAsync(int userId, ChangePasswordRequest request);
}
