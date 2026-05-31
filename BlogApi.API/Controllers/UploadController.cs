using BlogApi.API.Common;
using BlogApi.API.DTOs.Upload;
using BlogApi.API.Validation.Upload;
using BlogApi.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlogApi.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly IUploadService _uploadService;

    public UploadController(IUploadService uploadService)
    {
        _uploadService = uploadService;
    }

    [Authorize]
    [RequestSizeLimit(5 * 1024 * 1024)]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<UploadResponseDto>>> Upload(IFormFile file, CancellationToken ct)
    {
        var errors = UploadValidation.Validate(file);
        if (errors.Count > 0)
        {
            return BadRequest(ApiResponse<UploadResponseDto>.Fail(400, "参数校验失败", errors));
        }

        await using var stream = file.OpenReadStream();
        var url = await _uploadService.UploadAsync(stream, Path.GetExtension(file.FileName), ct);

        return Ok(ApiResponse<UploadResponseDto>.Success(new UploadResponseDto { Url = url }));
    }
}
