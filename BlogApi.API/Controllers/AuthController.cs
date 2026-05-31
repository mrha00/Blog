using System.Security.Claims;
using BlogApi.API.DTOs.Auth;
using BlogApi.Core.Interfaces;
using BlogApi.Core.Models.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
    {
        var result = await _authService.RegisterAsync(
            new RegisterRequest(dto.Username, dto.Email, dto.Password, dto.Nickname));

        return Ok(MapToResponse(result));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        var result = await _authService.LoginAsync(
            new LoginRequest(dto.Username, dto.Password));

        return Ok(MapToResponse(result));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserProfileDto>> Me()
    {
        var userId = GetCurrentUserId();
        var profile = await _authService.GetProfileAsync(userId);
        return Ok(MapToProfileDto(profile));
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<UserProfileDto>> UpdateProfile(UpdateProfileDto dto)
    {
        var userId = GetCurrentUserId();
        var profile = await _authService.UpdateProfileAsync(
            userId,
            new UpdateProfileRequest(dto.Nickname, dto.AvatarUrl));

        return Ok(MapToProfileDto(profile));
    }

    [Authorize]
    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
    {
        var userId = GetCurrentUserId();
        await _authService.ChangePasswordAsync(
            userId,
            new ChangePasswordRequest(dto.CurrentPassword, dto.NewPassword));

        return NoContent();
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
