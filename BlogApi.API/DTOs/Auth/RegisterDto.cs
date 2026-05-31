using System.ComponentModel.DataAnnotations;

namespace BlogApi.API.DTOs.Auth;

public class RegisterDto
{
    [Required]
    [StringLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [StringLength(30, MinimumLength = 2)]
    public string Nickname { get; set; } = string.Empty;
}
