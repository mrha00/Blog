using System.Security.Claims;
using BlogApi.API.DTOs.Comments;
using BlogApi.Core.Constants;
using BlogApi.Core.Interfaces;
using BlogApi.Core.Models.Comments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlogApi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;

    public CommentsController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole(Roles.Admin);
        await _commentService.SoftDeleteAsync(id, userId, isAdmin);
        return NoContent();
    }
}
