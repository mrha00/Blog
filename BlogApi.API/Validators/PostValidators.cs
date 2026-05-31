using FluentValidation;
using BlogApi.API.DTOs.Posts;

namespace BlogApi.API.Validators;

public class CreatePostDtoValidator : AbstractValidator<CreatePostDto>
{
    public CreatePostDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("标题不能为空")
            .MaximumLength(200).WithMessage("标题不能超过 200 个字符");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("正文不能为空");

        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("请选择有效分类");

        RuleFor(x => x.CoverUrl)
            .Must(url => string.IsNullOrWhiteSpace(url) || url.StartsWith("/uploads/", StringComparison.Ordinal))
            .WithMessage("封面地址无效，请通过上传接口获取")
            .When(x => x.CoverUrl != null);
    }
}

public class UpdatePostDtoValidator : AbstractValidator<UpdatePostDto>
{
    public UpdatePostDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("标题不能为空")
            .MaximumLength(200).WithMessage("标题不能超过 200 个字符");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("正文不能为空");

        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("请选择有效分类");

        RuleFor(x => x.CoverUrl)
            .Must(url => string.IsNullOrWhiteSpace(url) || url.StartsWith("/uploads/", StringComparison.Ordinal))
            .WithMessage("封面地址无效，请通过上传接口获取")
            .When(x => x.CoverUrl != null);
    }
}

public class PostQueryDtoValidator : AbstractValidator<PostQueryDto>
{
    public PostQueryDtoValidator()
    {
        RuleFor(x => x.Page).GreaterThan(0).WithMessage("页码必须大于 0");
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100).WithMessage("每页数量需在 1-100 之间");
    }
}
