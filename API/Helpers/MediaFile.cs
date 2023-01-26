using API.Interfaces;

namespace API.Helpers;

public class MediaFile : IMediaFile
{
    public IFormFile File { get; set; }

    public string Url { get; set; }

    public string PublicId { get; set; }

    public MediaType Type { get; set; }
}