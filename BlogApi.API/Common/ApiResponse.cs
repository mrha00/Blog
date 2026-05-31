namespace BlogApi.API.Common;

public class ApiResponse<T>
{
    public int Code { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<ValidationErrorItem>? Errors { get; set; }

    public static ApiResponse<T> Success(T data, string message = "success")
    {
        return new ApiResponse<T>
        {
            Code = 200,
            Message = message,
            Data = data
        };
    }

    public static ApiResponse<T> Fail(
        int code,
        string message,
        List<ValidationErrorItem>? errors = null)
    {
        return new ApiResponse<T>
        {
            Code = code,
            Message = message,
            Errors = errors
        };
    }
}

public class ValidationErrorItem
{
    public string Field { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
