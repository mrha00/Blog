using FluentValidation;
using BlogApi.API.DTOs.Categories;
using BlogApi.API.DTOs.Comments;
using BlogApi.API.DTOs.Tags;

namespace BlogApi.API.Validators;

public class CreateCategoryDtoValidator : AbstractValidator<CreateCategoryDto>
{
    public CreateCategoryDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("分类名称不能为空")
            .MaximumLength(50).WithMessage("分类名称不能超过 50 个字符");
    }
}

public class UpdateCategoryDtoValidator : AbstractValidator<UpdateCategoryDto>
{
    public UpdateCategoryDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("分类名称不能为空")
            .MaximumLength(50).WithMessage("分类名称不能超过 50 个字符");
    }
}

public class CreateTagDtoValidator : AbstractValidator<CreateTagDto>
{
    public CreateTagDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("标签名称不能为空")
            .MaximumLength(30).WithMessage("标签名称不能超过 30 个字符");
    }
}

public class UpdateTagDtoValidator : AbstractValidator<UpdateTagDto>
{
    public UpdateTagDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("标签名称不能为空")
            .MaximumLength(30).WithMessage("标签名称不能超过 30 个字符");
    }
}

public class CreateCommentDtoValidator : AbstractValidator<CreateCommentDto>
{
    public CreateCommentDtoValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("评论内容不能为空")
            .MaximumLength(2000).WithMessage("评论内容不能超过 2000 个字符");
    }
}
