using FluentValidation;
using BlogApi.API.DTOs.Auth;

namespace BlogApi.API.Validators;

public class RegisterDtoValidator : AbstractValidator<RegisterDto>
{
    public RegisterDtoValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("用户名不能为空")
            .MaximumLength(50).WithMessage("用户名不能超过 50 个字符");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("邮箱不能为空")
            .EmailAddress().WithMessage("邮箱格式不正确");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("密码不能为空")
            .MinimumLength(6).WithMessage("密码至少 6 个字符");

        RuleFor(x => x.Nickname)
            .NotEmpty().WithMessage("昵称不能为空")
            .MinimumLength(2).WithMessage("昵称至少 2 个字符")
            .MaximumLength(30).WithMessage("昵称不能超过 30 个字符");
    }
}

public class LoginDtoValidator : AbstractValidator<LoginDto>
{
    public LoginDtoValidator()
    {
        RuleFor(x => x.Username).NotEmpty().WithMessage("用户名不能为空");
        RuleFor(x => x.Password).NotEmpty().WithMessage("密码不能为空");
    }
}

public class UpdateProfileDtoValidator : AbstractValidator<UpdateProfileDto>
{
    public UpdateProfileDtoValidator()
    {
        RuleFor(x => x.Nickname)
            .MinimumLength(2).WithMessage("昵称至少 2 个字符")
            .MaximumLength(30).WithMessage("昵称不能超过 30 个字符")
            .When(x => !string.IsNullOrWhiteSpace(x.Nickname));

        RuleFor(x => x.AvatarUrl)
            .Must(url => string.IsNullOrWhiteSpace(url) || url.StartsWith("/uploads/", StringComparison.Ordinal))
            .WithMessage("头像地址无效，请通过上传接口获取")
            .When(x => x.AvatarUrl != null);
    }
}

public class ChangePasswordDtoValidator : AbstractValidator<ChangePasswordDto>
{
    public ChangePasswordDtoValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty().WithMessage("请输入当前密码");
        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("请输入新密码")
            .MinimumLength(6).WithMessage("新密码至少 6 个字符")
            .NotEqual(x => x.CurrentPassword).WithMessage("新密码不能与当前密码相同");
    }
}
