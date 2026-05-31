using BlogApi.API.Common;
using BlogApi.API.DTOs.Auth;
using BlogApi.Core.Interfaces;
using BlogApi.Core.Models.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace BlogApi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [EnableRateLimiting("auth")]
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register(RegisterDto dto)
    {
        var result = await _authService.RegisterAsync(
            new RegisterRequest(dto.Username, dto.Email, dto.Password, dto.Nickname));

        return Ok(ApiResponse<AuthResponseDto>.Success(MapToResponse(result), "注册成功"));
    }

    [EnableRateLimiting("auth")]
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login(LoginDto dto)
    {
        var result = await _authService.LoginAsync(
            new LoginRequest(dto.Username, dto.Password));

        return Ok(ApiResponse<AuthResponseDto>.Success(MapToResponse(result), "登录成功"));
    }

    [EnableRateLimiting("auth")]
    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Refresh(RefreshTokenDto dto)
    {
        var result = await _authService.RefreshAsync(dto.RefreshToken);
        return Ok(ApiResponse<AuthResponseDto>.Success(MapToResponse(result), "令牌已刷新"));
    }

    [HttpPost("logout")]
    public async Task<ActionResult<ApiResponse<object>>> Logout(RefreshTokenDto dto)
    {
        await _authService.RevokeRefreshTokenAsync(dto.RefreshToken);
        return Ok(ApiResponse<object>.Success(null!, "已退出登录"));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> Me()
    {
        var userId = GetCurrentUserId();
        var profile = await _authService.GetProfileAsync(userId);
        return Ok(ApiResponse<UserProfileDto>.Success(MapToProfileDto(profile)));
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<ApiResponse<UserProfileDto>>> UpdateProfile(UpdateProfileDto dto)
    {
        var userId = GetCurrentUserId();
        var profile = await _authService.UpdateProfileAsync(
            userId,
            new UpdateProfileRequest(dto.Nickname, dto.AvatarUrl));

        return Ok(ApiResponse<UserProfileDto>.Success(MapToProfileDto(profile), "资料已更新"));
    }

    [Authorize]
    [HttpPut("password")]
    public async Task<ActionResult<ApiResponse<object>>> ChangePassword(ChangePasswordDto dto)
    {
        var userId = GetCurrentUserId();
        await _authService.ChangePasswordAsync(
            userId,
            new ChangePasswordRequest(dto.CurrentPassword, dto.NewPassword));

        return Ok(ApiResponse<object>.Success(null!, "密码已修改"));
    }

    private int GetCurrentUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(raw, out var userId))
        {
            throw new UnauthorizedAccessException("无效的用户身份");
        }

        return userId;
    }

    private static AuthResponseDto MapToResponse(AuthTokenResult result)
    {
        return new AuthResponseDto
        {
            Token = result.Token,
            RefreshToken = result.RefreshToken,
            UserId = result.UserId,
            Username = result.Username,
            Nickname = result.Nickname,
            Role = result.Role,
            AvatarUrl = result.AvatarUrl
        };
    }

    private static UserProfileDto MapToProfileDto(UserProfile profile)
    {
        return new UserProfileDto
        {
            UserId = profile.UserId,
            Username = profile.Username,
            Nickname = profile.Nickname,
            Email = profile.Email,
            Role = profile.Role,
            AvatarUrl = profile.AvatarUrl,
            CreatedAt = profile.CreatedAt
        };
    }
}
