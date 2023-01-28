using System.Text;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.IdentityModel.Tokens;

namespace API.SignalR;

public interface IData
{
    public string Url { get; set; }
    public MediaType MediaType { get; set; }
}

[Authorize]
public class MessageHub : Hub
{
    private readonly IMediaUploadService _mediaUploadService;
    private readonly IHubContext<PresenceHub> _presenceHub;
    private readonly IUnitOfWork _uow;

    public MessageHub(IUnitOfWork uow,
        IMediaUploadService mediaUploadService, IHubContext<PresenceHub> presenceHub)
    {
        _uow = uow;
        _mediaUploadService = mediaUploadService;
        _presenceHub = presenceHub;
    }

    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();

        var otherUser = httpContext.Request.Query["user"];
        var groupName = GetGroupName(Context.User.GetUsername(), otherUser);
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        var group = await AddToGroup(groupName);

        await Clients.Group(groupName).SendAsync("UpdatedGroup", group);

        var messages = await _uow.MessageRepository.GetMessageThread(Context.User.GetUsername(), otherUser);

        if (_uow.HasChanges()) await _uow.Complete();

        await Clients.Caller.SendAsync("ReceiveMessageThread", messages);
    }

    public override async Task OnDisconnectedAsync(Exception exception)
    {
        var group = await RemoveFromGroup();
        await Clients.Group(group.Name).SendAsync("UpdatedGroup");
        await base.OnDisconnectedAsync(exception);
    }

    private string GetGroupName(string caller, string other)
    {
        var stringCompare = string.CompareOrdinal(caller, other) < 0;

        return stringCompare ? $"{caller}-{other}" : $"{other}-{caller}";
    }


    public async Task SendMessage(string recipientUsername, string content, MessageType messageType,
        List<string> mediaFiles, List<MediaType> mediaTypes
    )
    {
        var files = new List<IMediaFile>();

        if (mediaFiles != null && mediaFiles.Any() && mediaTypes != null && mediaFiles.Count == mediaTypes.Count)
            for (var i = 0; i < mediaFiles.Count; i++)
            {
                var mediaFile = mediaFiles.ElementAt(i);
                var extension = mediaFile.Split(";")[0].Split("/")[1];

                var bytes = Encoding.UTF8.GetBytes(mediaFile);
                var ms = new MemoryStream(bytes);

                files.Add(new MediaFile
                {
                    File = new FormFile(ms, 0, ms.Length, $"file.{extension}", $"file.{extension}"),
                    Url = null,
                    PublicId = null,
                    Type = mediaTypes[i]
                });
            }

        if (files.Count > 6) files = files.Take(6).ToList();
        if (files.Select(file => MimeTypes.GetMimeType(file.File.Name)).Any(mimeType =>
                !mimeType.StartsWith("image/") && !mimeType.StartsWith("video/")))
            throw new HubException("File type not supported, supported types: Image/Video");

        var username = Context.User.GetUsername();
        if (string.IsNullOrEmpty(content) &&
            files.IsNullOrEmpty())
            throw new HubException("Cannot send empty message.");

        if (username == recipientUsername.ToLower())
            throw new HubException("You cannot message yourself");

        if (files == null)
            throw new HubException("Media files not attached");


        var sender = await _uow.UserRepository.GetUserByUsernameAsync(username);
        var recipient = await _uow.UserRepository.GetUserByUsernameAsync(recipientUsername);

        if (recipient == null) throw new HubException("Not Found");


        var media = new List<Media>();

        if (files.Any())
            foreach (var file in files)
            {
                UploadResult result = file.Type switch
                {
                    MediaType.Image => await _mediaUploadService.AddPhotoAsync(file.File, false),
                    MediaType.Video => await _mediaUploadService.AddVideoAsync(file.File),
                    _ => throw new HubException("Media type not supported.")
                };

                if (result != null)
                {
                    if (result.Error != null) throw new HubException(result.Error.Message);

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
            Content = content,
            MessageType = messageType,
            Media = media
        };

        var groupName = GetGroupName(sender.UserName, recipient.UserName);

        var group = await _uow.MessageRepository.GetMessageGroup(groupName);

        if (group.Connections.Any(x => x.Username == recipient.UserName))
        {
            message.DateRead = DateTime.UtcNow;
        }
        else
        {
            var connections = await PresenceTracker.GetConnectionsForUser(recipientUsername);
            if (connections != null)
                await _presenceHub.Clients.Clients(connections).SendAsync("NewMessageReceived",
                    new { username = sender.UserName, knownAs = sender.KnownAs });
        }

        _uow.MessageRepository.AddMessage(message);

        if (!await _uow.Complete()) throw new HubException("Failed to send message");

        var messageDto = new MessageDto
        {
            Id = message.Id,
            SenderId = sender.Id,
            SenderUsername = sender.UserName,
            SenderPhotoUrl = sender.Photos.FirstOrDefault(p => p.IsMain)?.Url,
            RecipientId = recipient.Id,
            RecipientUsername = recipient.UserName,
            RecipientPhotoUrl = recipient.Photos.FirstOrDefault(p => p.IsMain)?.Url,
            Content = content,
            Media = media,
            DateRead = message.DateRead,
            MessageType = messageType,
            MessageSent = DateTime.UtcNow
        };
        await Clients.Group(groupName).SendAsync("NewMessage", messageDto);
    }

    private async Task<Group> AddToGroup(string groupName)
    {
        var group = await _uow.MessageRepository.GetMessageGroup(groupName);
        var connection = new Connection(Context.ConnectionId, Context.User.GetUsername());

        if (group == null)
        {
            group = new Group(groupName);
            _uow.MessageRepository.AddGroup(group);
        }

        group.Connections.Add(connection);
        if (await _uow.Complete()) return group;

        throw new HubException("Failed to add to group");
    }


    private async Task<Group> RemoveFromGroup()
    {
        var group = await _uow.MessageRepository.GetGroupForConnection(Context.ConnectionId);
        var connection = group.Connections.FirstOrDefault(x => x.ConnectionId == Context.ConnectionId);

        _uow.MessageRepository.RemoveConnection(connection);
        if (await _uow.Complete()) return group;

        throw new HubException("Failed to remove from group");
    }
}