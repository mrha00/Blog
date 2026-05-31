namespace BlogApi.Core.Models.Auth;

public record RegisterRequest(string Username, string Email, string Password);

public record LoginRequest(string Username, string Password);

public record AuthTokenResult(string Token, int UserId, string Username, string Role);
