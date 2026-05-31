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
    public async Task<ActionResult<List<TagDto>>> GetTags()
    {
        var items = await _tagService.GetAllAsync();
        return Ok(items.Select(MapToDto).ToList());
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPost]
    public async Task<ActionResult<TagDto>> CreateTag(CreateTagDto dto)
    {
        var item = await _tagService.CreateAsync(new CreateTagRequest(dto.Name));
        return CreatedAtAction(nameof(GetTags), new { id = item.Id }, MapToDto(item));
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteTag(int id)
    {
        await _tagService.DeleteAsync(id);
        return NoContent();
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
