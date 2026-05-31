using BlogApi.Core.Models.Auth;

namespace BlogApi.Core.Interfaces;

public interface IAuthService
{
    Task<AuthTokenResult> RegisterAsync(RegisterRequest request);
    Task<AuthTokenResult> LoginAsync(LoginRequest request);
}
