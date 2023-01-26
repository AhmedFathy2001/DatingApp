using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize]
public class UsersController : BaseApiController
{
    private readonly ILikeRepository _likeRepository;
    private readonly IMapper _mapper;
    private readonly IMediaUploadService _mediaUploadService;
    private readonly IUserRepository _userRepository;

    public UsersController(IUserRepository userRepository, IMapper mapper, IMediaUploadService mediaUploadService,
        ILikeRepository likeRepository)
    {
        _userRepository = userRepository;
        _mapper = mapper;
        _mediaUploadService = mediaUploadService;
        _likeRepository = likeRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MemberDto>>> GetUsers([FromQuery] UserParams userParams)
    {
        var currentUser = await _userRepository.GetUserByUsernameAsync(User.GetUsername());
        userParams.CurrentUsername = currentUser.UserName;

        if (string.IsNullOrEmpty(userParams.Gender))
            userParams.Gender = currentUser.Gender == "male" ? "female" : "male";

        var users = await _userRepository.GetMembersAsync(userParams);
        var usersWithLikes = new PagedList<MemberDto>(
            users,
            users.TotalCount,
            users.CurrentPage,
            users.PageSize);
        usersWithLikes.Clear();

        users.ForEach(user =>
        {
            usersWithLikes.Add(new MemberDto
            {
                UserName = user.UserName,
                PhotoUrl = user.PhotoUrl,
                Age = user.Age,
                City = user.City,
                KnownAs = user.KnownAs,
                Country = user.Country,
                Photos = user.Photos,
                IsLiked = _likeRepository.GetUserIsLiked(user.Id, User.GetUserId()),
                CreatedAt = user.CreatedAt,
                LastActive = user.LastActive,
                Gender = user.Gender,
                Interests = user.Interests,
                Id = user.Id,
                Introduction = user.Introduction,
                LookingFor = user.LookingFor
            });
        });

        Response.AddPaginationHeader(
            new PaginationHeader(
                usersWithLikes.CurrentPage,
                usersWithLikes.PageSize,
                usersWithLikes.TotalCount,
                usersWithLikes.TotalPages));

        return Ok(usersWithLikes);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MemberDto>> GetUserById(int id)
    {
        var user = await _userRepository.GetMemberByIdAsync(id);

        if (user == null)
            return NotFound();

        return user;
    }

    [HttpGet("{username}")]
    public async Task<ActionResult<MemberDto>> GetUser(string username)
    {
        var user = await _userRepository.GetMemberByUsernameAsync(username);


        if (user == null)
            return NotFound();

        user.IsLiked = _likeRepository.GetUserIsLiked(user.Id, User.GetUserId());

        return user;
    }

    [HttpPut]
    public async Task<ActionResult> UpdateUser(MemberUpdateDto memberUpdateDto)
    {
        var user = await _userRepository.GetUserByUsernameAsync(User.GetUsername());

        if (user == null) return NotFound();

        _mapper.Map(memberUpdateDto, user);
        if (await _userRepository.SaveAllAsync()) return NoContent();

        return BadRequest("Failed to update user");
    }

    [HttpPost("add-photo")]
    public async Task<ActionResult<PhotoDto>> AddPhoto(IFormFile file)
    {
        var user = await _userRepository.GetUserByUsernameAsync(User.GetUsername());

        if (user == null) return NotFound();

        var result = await _mediaUploadService.AddPhotoAsync(file, true);

        if (result.Error != null) return BadRequest(result.Error.Message);

        var photo = new Photo
        {
            Url = result.SecureUrl.AbsoluteUri,
            PublicId = result.PublicId
        };

        if (user.Photos.Count == 0) photo.IsMain = true;

        user.Photos.Add(photo);

        if (await _userRepository.SaveAllAsync())
            return
                CreatedAtAction(
                    nameof(GetUser),
                    new { username = user.UserName },
                    _mapper.Map<PhotoDto>(photo)
                );

        return BadRequest("There was a problem adding the photo");
    }

    [HttpPut("set-main-photo/{photoId:int}")]
    public async Task<ActionResult> SetMainPhoto(int photoId)
    {
        var user = await _userRepository.GetUserByUsernameAsync(User.GetUsername());

        var photo = user.Photos.FirstOrDefault(photo => photo.Id == photoId);

        if (photo == null) return NotFound();

        if (photo.IsMain) return BadRequest("This is already your main photo");

        var currentMain = user.Photos.FirstOrDefault(photo => photo.IsMain);
        if (currentMain != null) currentMain.IsMain = false;
        photo.IsMain = true;

        if (await _userRepository.SaveAllAsync()) return NoContent();

        return BadRequest("Problem setting main photo");
    }

    [HttpDelete("delete-photo/{photoId:int}")]
    public async Task<ActionResult> DeletePhoto(int photoId)
    {
        var user = await _userRepository.GetUserByUsernameAsync(User.GetUsername());

        if (user == null) return NotFound();

        var photo = user.Photos.FirstOrDefault(p => p.Id == photoId);

        if (photo == null) return NotFound();

        if (photo.IsMain) return BadRequest("You cannot delete your main photo");

        if (photo.PublicId != null)
        {
            var result = await _mediaUploadService.DeleteMediaAsync(new List<string>
            {
                photo.PublicId
            });

            foreach (var t in result.Where(t => t.Error != null))
                return BadRequest(t.Error.Message);
        }

        user.Photos.Remove(photo);

        if (await _userRepository.SaveAllAsync()) return Ok();

        return BadRequest("Problem deleting photo");
    }
}