using API.Interfaces;

namespace API.DTOs;

public class CreateMessageDto
{
    public string RecipientUsername { get; set; }

    //
    public string Content { get; set; }

    public MessageType MessageType { get; set; }

    public IEnumerable<IFormFile> Files { get; set; }

    public IEnumerable<string> Urls { get; set; }

    public IEnumerable<string> PublicIds { get; set; }

    public IEnumerable<MediaType> MessageTypes { get; set; }
}