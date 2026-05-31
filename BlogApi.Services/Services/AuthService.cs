using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BlogApi.Core.Configuration;
using BlogApi.Core.Constants;
using BlogApi.Core.Entities;
using BlogApi.Core.Exceptions;
using BlogApi.Core.Interfaces;
using BlogApi.Core.Models.Auth;
using BlogApi.Services.Helpers;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace BlogApi.Services.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IFileStorageService _fileStorageService;
    private readonly JwtSettings _jwtSettings;

    public AuthService(
        IUserRepository userRepository,
        IRefreshTokenRepository refreshTokenRepository,
        IFileStorageService fileStorageService,
        IOptions<JwtSettings> jwtSettings)
    {
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _fileStorageService = fileStorageService;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<AuthTokenResult> RegisterAsync(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ArgumentException("用户名、邮箱和密码不能为空");
        }

        if (await _userRepository.ExistsByUsernameOrEmailAsync(request.Username, request.Email))
        {
            throw new InvalidOperationException("用户名或邮箱已存在");
        }

        var nickname = string.IsNullOrWhiteSpace(request.Nickname)
            ? request.Username.Trim()
            : request.Nickname.Trim();

        var user = new User
        {
            Username = request.Username.Trim(),
            Nickname = nickname,
            Email = request.Email.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = Roles.User,
            CreatedAt = DateTime.UtcNow
        };

        user = await _userRepository.AddAsync(user);
        return await CreateTokenResultAsync(user);
    }

    public async Task<AuthTokenResult> LoginAsync(LoginRequest request)
    {
        var user = await _userRepository.GetByUsernameAsync(request.Username);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("用户名或密码错误");
        }

        return await CreateTokenResultAsync(user);
    }

    public async Task<AuthTokenResult> RefreshAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw new UnauthorizedAccessException("Refresh Token 无效");
        }

        var hash = HashToken(refreshToken.Trim());
        var stored = await _refreshTokenRepository.GetActiveByHashAsync(hash);
        if (stored?.User is null)
        {
            throw new UnauthorizedAccessException("Refresh Token 已失效，请重新登录");
        }

        await _refreshTokenRepository.RevokeAsync(stored);
        return await CreateTokenResultAsync(stored.User);
    }

    public async Task RevokeRefreshTokenAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return;
        }

        var hash = HashToken(refreshToken.Trim());
        var stored = await _refreshTokenRepository.GetActiveByHashAsync(hash);
        if (stored is not null)
        {
            await _refreshTokenRepository.RevokeAsync(stored);
        }
    }

    public async Task<UserProfile> GetProfileAsync(int userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null)
        {
            throw new NotFoundException("用户不存在");
        }

        return MapToProfile(user);
    }

    public async Task<UserProfile> UpdateProfileAsync(int userId, UpdateProfileRequest request)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null)
        {
            throw new NotFoundException("用户不存在");
        }

        if (request.Nickname is not null)
        {
            var nickname = request.Nickname.Trim();
            if (nickname.Length < 2 || nickname.Length > 32)
            {
                throw new ArgumentException("昵称长度需在 2–32 个字符之间");
            }

            user.Nickname = nickname;
        }

        if (request.AvatarUrl is not null)
        {
            var avatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl)
                ? null
                : request.AvatarUrl.Trim();

            UploadUrlValidator.ValidateOrThrow(avatarUrl);

            if (!string.Equals(user.AvatarUrl, avatarUrl, StringComparison.OrdinalIgnoreCase))
            {
                _fileStorageService.TryDeleteUpload(user.AvatarUrl);
                user.AvatarUrl = avatarUrl;
            }
        }

        user = await _userRepository.UpdateAsync(user);
        return MapToProfile(user);
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
            string.IsNullOrWhiteSpace(request.NewPassword))
        {
            throw new ArgumentException("当前密码和新密码不能为空");
        }

        if (request.NewPassword.Length < 6)
        {
            throw new ArgumentException("新密码至少 6 个字符");
        }

        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null)
        {
            throw new NotFoundException("用户不存在");
        }

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("当前密码不正确");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _userRepository.UpdateAsync(user);
        await _refreshTokenRepository.RevokeAllForUserAsync(userId);
    }

    private async Task<AuthTokenResult> CreateTokenResultAsync(User user)
    {
        var accessToken = GenerateAccessToken(user);
        var refreshToken = GenerateRefreshToken();
        var hash = HashToken(refreshToken);

        await _refreshTokenRepository.AddAsync(new RefreshToken
        {
            TokenHash = hash,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshExpireDays),
            CreatedAt = DateTime.UtcNow
        });

        return new AuthTokenResult(
            accessToken,
            refreshToken,
            user.Id,
            user.Username,
            user.Nickname,
            user.Role,
            user.AvatarUrl);
    }

    private static UserProfile MapToProfile(User user)
    {
        return new UserProfile(
            user.Id,
            user.Username,
            user.Nickname,
            user.Email,
            user.Role,
            user.AvatarUrl,
            user.CreatedAt);
    }

    private string GenerateAccessToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim("nickname", user.Nickname),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpireMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    private static string HashToken(string token)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(hash);
    }
}
