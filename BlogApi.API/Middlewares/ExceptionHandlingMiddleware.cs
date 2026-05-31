using System.Net;
using System.Text.Json;
using BlogApi.API.Common;
using BlogApi.Core.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace BlogApi.API.Middlewares;

public class ExceptionHandlingMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message) = exception switch
        {
            NotFoundException notFound => (HttpStatusCode.NotFound, notFound.Message),
            ForbiddenException forbidden => (HttpStatusCode.Forbidden, forbidden.Message),
            UnauthorizedAccessException unauthorized => (HttpStatusCode.Unauthorized, unauthorized.Message),
            InvalidOperationException invalid when invalid.Message.Contains("已存在") =>
                (HttpStatusCode.Conflict, invalid.Message),
            InvalidOperationException invalid => (HttpStatusCode.BadRequest, invalid.Message),
            ArgumentException argument => (HttpStatusCode.BadRequest, argument.Message),
            DbUpdateException => (HttpStatusCode.BadRequest, "数据更新失败，请检查关联数据后重试"),
            _ => (HttpStatusCode.InternalServerError, "服务器内部错误")
        };

        if (statusCode == HttpStatusCode.InternalServerError)
        {
            _logger.LogError(exception, "Unhandled exception");
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = ApiResponse<object>.Fail((int)statusCode, message);
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
    }
}
