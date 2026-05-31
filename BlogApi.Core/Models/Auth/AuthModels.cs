namespace BlogApi.Core.Models.Auth;

public record RegisterRequest(string Username, string Email, string Password, string? Nickname);

public record LoginRequest(string Username, string Password);

public record AuthTokenResult(
    string Token,
    string RefreshToken,
    int UserId,
    string Username,
    string Nickname,
    string Role,
    string? AvatarUrl);

public record RefreshTokenRequest(string RefreshToken);

public record UserProfile(
    int UserId,
    string Username,
    string Nickname,
    string Email,
    string Role,
    string? AvatarUrl,
    string? Bio,
    DateTime CreatedAt);

public record UpdateProfileRequest(string? Nickname, string? AvatarUrl, string? Bio);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
