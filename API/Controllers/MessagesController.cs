using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class MessagesController : BaseApiController
{
    private readonly IMediaUploadService _mediaUploadService;
    private readonly IUnitOfWork _uow;

    public MessagesController(IUnitOfWork uow,
        IMediaUploadService mediaUploadService)
    {
        _uow = uow;
        _mediaUploadService = mediaUploadService;
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<MessageDto>> CreateMessage([FromForm] CreateMessageDto createMessageDto)
    {
        var files = new List<IMediaFile>();

        if (files.Count > 6) files = files.Take(6).ToList();
        if (files.Select(file => MimeTypes.GetMimeType(file.File.Name)).Any(mimeType =>
                !mimeType.StartsWith("image/") && !mimeType.StartsWith("video/")))
            return BadRequest("File type not supported, supported types: Image/Video");

        var username = User.GetUsername();
        if ((createMessageDto.Content == null || createMessageDto.Content.Trim().Length == 0) &&
            createMessageDto.Files == null)
            return BadRequest("Cannot send empty message.");

        if (username == createMessageDto.RecipientUsername.ToLower()) return BadRequest("You cannot message yourself");

        if (createMessageDto.MessageType != MessageType.Text && createMessageDto.Files == null)
            return BadRequest("Media files not attached");


        var sender = await _uow.UserRepository.GetUserByUsernameAsync(username);
        var recipient = await _uow.UserRepository.GetUserByUsernameAsync(createMessageDto.RecipientUsername);

        if (recipient == null) return NotFound();

        if (createMessageDto.MessageType == MessageType.Files &&
            createMessageDto.Files.Count() == createMessageDto.MessageTypes.Count())
            for (var i = 0; i < createMessageDto.Files.Count(); i++)
                files.Add(new MediaFile
                {
                    File = createMessageDto.Files.ElementAt(i),
                    Type = createMessageDto.MessageTypes.ElementAt(i)
                });

        var media = new List<Media>();

        if (files.Any())
            foreach (var file in files)
            {
                UploadResult result = file.Type switch
                {
                    MediaType.Image => await _mediaUploadService.AddPhotoAsync(file.File, false),
                    MediaType.Video => await _mediaUploadService.AddVideoAsync(file.File),
                    _ => null
                };

                if (result != null)
                {
                    if (result.Error != null) return BadRequest(result.Error.Message);

                    file.Url = result.SecureUrl.AbsoluteUri;
                    file.PublicId = result.PublicId;

                    media.Add(new Media
                    {
                        Url = result.SecureUrl.AbsoluteUri,
                        PublicId = result.PublicId,
                        Type = file.Type
                    });
                }
            }

        var message = new Message
        {
            Sender = sender,
            Recipient = recipient,
            SenderUsername = sender.UserName,
            RecipientUsername = recipient.UserName,
            Content = createMessageDto.Content,
            MessageType = createMessageDto.MessageType,
            Media = media
        };

        _uow.MessageRepository.AddMessage(message);

        if (!await _uow.Complete()) return BadRequest("Failed to send message");

        var messageDto = new MessageDto
        {
            Id = message.Id,
            SenderId = sender.Id,
            SenderUsername = sender.UserName,
            SenderPhotoUrl = sender.Photos.FirstOrDefault(p => p.IsMain)?.Url,
            RecipientId = recipient.Id,
            RecipientUsername = recipient.UserName,
            RecipientPhotoUrl = recipient.Photos.FirstOrDefault(p => p.IsMain)?.Url,
            Content = createMessageDto.Content,
            Media = media,
            MessageType = createMessageDto.MessageType,
            MessageSent = DateTime.UtcNow
        };

        // var group = GetGroupName(sender.UserName, recipient.UserName);
        // await Clients.Group(group).SendAsync("NewMessage", messageDto);
        return createMessageDto.MessageType switch
        {
            MessageType.Text => CreatedAtAction(nameof(CreateMessage), messageDto),
            MessageType.Files => Ok(messageDto),
            _ => BadRequest("Unhandled message type")
        };
    }

    // private string GetGroupName(string caller, string other)
    // {
    //     var stringCompare = string.CompareOrdinal(caller, other) < 0;
    //
    //     return stringCompare ? $"{caller}-{other}" : $"{other}-{caller}";
    // }


    [HttpGet]
    public async Task<ActionResult<PagedList<MessageDto>>> GetMessagesForUser([FromQuery] MessageParams messageParams)
    {
        messageParams.Username = User.GetUsername();

        var messages = await _uow.MessageRepository.GetMessagesForUser(messageParams);

        Response.AddPaginationHeader(new PaginationHeader(messages.CurrentPage, messages.PageSize, messages.TotalCount,
            messages.TotalPages));


        return messages;
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteMessage(int id)
    {
        var username = User.GetUsername();

        var message = await _uow.MessageRepository.GetMessage(id);

        if (message == null) return NotFound();

        if (message.SenderUsername != username && message.RecipientUsername != username) return Unauthorized();

        if (message.SenderUsername == username) message.SenderDeleted = true;
        if (message.RecipientUsername == username) message.RecipientDeleted = true;

        if (message.SenderDeleted && message.RecipientDeleted)
        {
            if (message.MessageType == MessageType.Files && message.Media != null)

            {
                var mediaList = message.Media.Select(m => m.PublicId).ToList();
                if (mediaList.Any())
                    await _mediaUploadService.DeleteMediaAsync(mediaList);
            }

            _uow.MessageRepository.DeleteMessage(message);
        }

        if (await _uow.Complete()) return Ok();

        return BadRequest("Problem deleting the message");
    }
}