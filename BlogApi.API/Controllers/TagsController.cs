using BlogApi.API.Common;
using BlogApi.API.DTOs.Tags;
using BlogApi.Core.Constants;
using BlogApi.Core.Interfaces;
using BlogApi.Core.Models.Tags;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlogApi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TagsController : ControllerBase
{
    private readonly ITagService _tagService;

    public TagsController(ITagService tagService)
    {
        _tagService = tagService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<TagDto>>>> GetTags()
    {
        var items = await _tagService.GetAllAsync();
        return Ok(ApiResponse<List<TagDto>>.Success(items.Select(MapToDto).ToList()));
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<TagDto>>> CreateTag(CreateTagDto dto)
    {
        var item = await _tagService.CreateAsync(new CreateTagRequest(dto.Name));
        return Ok(ApiResponse<TagDto>.Success(MapToDto(item), "标签已创建"));
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<TagDto>>> UpdateTag(int id, UpdateTagDto dto)
    {
        var item = await _tagService.UpdateAsync(id, new UpdateTagRequest(dto.Name));
        return Ok(ApiResponse<TagDto>.Success(MapToDto(item), "标签已更新"));
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteTag(int id)
    {
        await _tagService.DeleteAsync(id);
        return Ok(ApiResponse<object>.Success(null!, "标签已删除"));
    }

    private static TagDto MapToDto(TagItem item)
    {
        return new TagDto
        {
            Id = item.Id,
            Name = item.Name
        };
    }
}
