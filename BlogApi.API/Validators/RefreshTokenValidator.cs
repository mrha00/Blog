using FluentValidation;
using BlogApi.API.DTOs.Auth;

namespace BlogApi.API.Validators;

public class RefreshTokenDtoValidator : AbstractValidator<RefreshTokenDto>
{
    public RefreshTokenDtoValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty().WithMessage("Refresh Token 不能为空");
    }
}
