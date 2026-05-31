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
    public IActionResult Me()
    {
        return Ok(new
        {
            UserId = User.FindFirstValue(ClaimTypes.NameIdentifier),
            Username = User.FindFirstValue(ClaimTypes.Name),
            Nickname = User.FindFirstValue("nickname"),
            Role = User.FindFirstValue(ClaimTypes.Role)
        });
    }

    private static AuthResponseDto MapToResponse(AuthTokenResult result)
    {
        return new AuthResponseDto
        {
            Token = result.Token,
            Username = result.Username,
            Nickname = result.Nickname,
            Role = result.Role
        };
    }
}
