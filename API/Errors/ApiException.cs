namespace API.Errors;

public class ApiException
{
    public ApiException(int statusCode, string message, string details)
    {
        StatusCode = statusCode;
        Message = message;
        Details = details;
    }

    private int StatusCode { get; }

    private string Message { get; }

    private string Details { get; }
}