using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class MessagesController : BaseApiController
{
    private readonly IMapper _mapper;
    private readonly IMediaUploadService _mediaUploadService;
    private readonly IMessageRepository _messageRepository;
    private readonly IUserRepository _userRepository;

    public MessagesController(IUserRepository userRepository, IMessageRepository messageRepository,
        IMediaUploadService mediaUploadService, IMapper mapper)
    {
        _userRepository = userRepository;
        _messageRepository = messageRepository;
        _mediaUploadService = mediaUploadService;
        _mapper = mapper;
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<MessageDto>> CreateMessage([FromForm] CreateMessageDto createMessageDto)
    {
        var username = User.GetUsername();
        string mediaUrl = null;
        string mediaPublicId = null;
        UploadResult result = null;
        if ((createMessageDto.Content == null || createMessageDto.Content.Trim().Length == 0) &&
            createMessageDto.File == null)
            return BadRequest("Cannot send empty message.");

        if (username == createMessageDto.RecipientUsername.ToLower()) return BadRequest("You cannot message yourself");

        if (createMessageDto.MessageType != MessageType.Text && createMessageDto.File == null)
            BadRequest("Media files not attached");

        if (createMessageDto.MessageType == MessageType.Image)
            result = await _mediaUploadService.AddPhotoAsync(createMessageDto.File);

        if (createMessageDto.MessageType == MessageType.Video)
            result = await _mediaUploadService.AddVideoAsync(createMessageDto.File);

        if (createMessageDto.File != null && result != null)
        {
            if (result.Error != null) return BadRequest(result.Error.Message);

            mediaUrl = result.SecureUrl.AbsoluteUri;
            mediaPublicId = result.PublicId;
        }

        var sender = await _userRepository.GetUserByUsernameAsync(username);
        var recipient = await _userRepository.GetUserByUsernameAsync(createMessageDto.RecipientUsername);

        if (recipient == null) return NotFound();

        var message = new Message
        {
            Sender = sender,
            Recipient = recipient,
            SenderUsername = sender.UserName,
            RecipientUsername = recipient.UserName,
            Content = createMessageDto.Content,
            MessageType = createMessageDto.MessageType,
            MediaUrl = mediaUrl,
            MediaPublicId = mediaPublicId
        };

        _messageRepository.AddMessage(message);

        if (!await _messageRepository.SaveAllAsync()) return BadRequest("Failed to send message");
        switch (createMessageDto.MessageType)
        {
            case MessageType.Text:
                return CreatedAtAction("CreateMessage", _mapper.Map<MessageDto>(message));
            case MessageType.Image:
            case MessageType.Video:
                if (result != null) return Created(result.SecureUrl, _mapper.Map<MessageDto>(message));
                break;
            default: return BadRequest("Unhandled message type");
        }

        return BadRequest("Failed to send message");
    }

    [HttpGet]
    public async Task<ActionResult<PagedList<MessageDto>>> GetMessagesForUser([FromQuery] MessageParams messageParams)
    {
        messageParams.Username = User.GetUsername();

        var messages = await _messageRepository.GetMessagesForUser(messageParams);

        Response.AddPaginationHeader(new PaginationHeader(messages.CurrentPage, messages.PageSize, messages.TotalCount,
            messages.TotalPages));

        return messages;
    }

    [HttpGet("thread/{username}")]
    public async Task<ActionResult<IEnumerable<MessageDto>>> GetMessageThread(string username)
    {
        var currentUsername = User.GetUsername();

        return Ok(await _messageRepository.GetMessageThread(currentUsername, username));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteMessage(int id)
    {
        var username = User.GetUsername();

        var message = await _messageRepository.GetMessage(id);

        if (message.SenderUsername != username && message.RecipientUsername != username) return Unauthorized();

        if (message.SenderUsername == username) message.SenderDeleted = true;
        if (message.RecipientUsername == username) message.RecipientDeleted = true;

        if (message.SenderDeleted && message.RecipientDeleted) _messageRepository.DeleteMessage(message);

        if (await _messageRepository.SaveAllAsync()) return Ok();

        return BadRequest("Problem deleting the message");
    }
}