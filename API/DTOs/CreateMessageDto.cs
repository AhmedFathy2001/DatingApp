using API.Interfaces;

namespace API.DTOs;

public class CreateMessageDto
{
    public IFormFile File { get; set; }
    public string RecipientUsername { get; set; }

    public string Content { get; set; }
    public string MediaUrl { get; set; }

    public string MediaPublicId { get; set; }

    public MessageType MessageType { get; set; }
}