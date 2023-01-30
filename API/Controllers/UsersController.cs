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
    private readonly IMapper _mapper;
    private readonly IMediaUploadService _mediaUploadService;
    private readonly IUnitOfWork _uow;

    public UsersController(IUnitOfWork uow, IMapper mapper, IMediaUploadService mediaUploadService
    )
    {
        _uow = uow;
        _mapper = mapper;
        _mediaUploadService = mediaUploadService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MemberDto>>> GetUsers([FromQuery] UserParams userParams)
    {
        var gender = await _uow.UserRepository.GetUserGender(User.GetUsername());
        userParams.CurrentUsername = User.GetUsername();

        if (string.IsNullOrEmpty(userParams.Gender))
            userParams.Gender = gender == "male" ? "female" : "male";

        var users = await _uow.UserRepository.GetMembersAsync(userParams);
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
                IsLiked = _uow.LikeRepository.GetUserIsLiked(user.Id, User.GetUserId()),
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
        var user = await _uow.UserRepository.GetMemberByIdAsync(id);

        if (user == null)
            return NotFound();

        return user;
    }

    [HttpGet("{username}")]
    public async Task<ActionResult<MemberDto>> GetUser(string username)
    {
        var user = await _uow.UserRepository.GetMemberByUsernameAsync(username, User.GetUsername());


        if (user == null)
            return NotFound();

        user.IsLiked = _uow.LikeRepository.GetUserIsLiked(user.Id, User.GetUserId());

        return user;
    }

    [HttpPut]
    public async Task<ActionResult> UpdateUser(MemberUpdateDto memberUpdateDto)
    {
        var user = await _uow.UserRepository.GetUserByUsernameAsync(User.GetUsername());

        if (user == null) return NotFound();

        _mapper.Map(memberUpdateDto, user);
        if (await _uow.Complete()) return NoContent();

        return BadRequest("Failed to update user");
    }

    [HttpPost("add-photo")]
    public async Task<ActionResult<PhotoDto>> AddPhoto(IFormFile file)
    {
        var user = await _uow.UserRepository.GetUserByUsernameAsync(User.GetUsername());

        if (user == null) return NotFound();

        var result = await _mediaUploadService.AddPhotoAsync(file, true);

        if (result.Error != null) return BadRequest(result.Error.Message);

        var photo = new Photo
        {
            Url = result.SecureUrl.AbsoluteUri,
            PublicId = result.PublicId
        };

        // if (user.Photos.Count == 0) photo.IsMain = true;

        user.Photos.Add(photo);

        if (await _uow.Complete())
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
        var user = await _uow.UserRepository.GetUserByUsernameAsync(User.GetUsername());

        var photo = user.Photos.FirstOrDefault(photo => photo.Id == photoId);

        if (photo == null) return NotFound();

        if (photo.IsMain) return BadRequest("This is already your main photo");

        if (!photo.IsApproved) return BadRequest("Photo is awaiting approval");

        var currentMain = user.Photos.FirstOrDefault(photo => photo.IsMain);
        if (currentMain != null) currentMain.IsMain = false;
        photo.IsMain = true;

        if (await _uow.Complete()) return NoContent();

        return BadRequest("Problem setting main photo");
    }

    [HttpDelete("delete-photo/{photoId:int}")]
    public async Task<ActionResult> DeletePhoto(int photoId)
    {
        var user = await _uow.UserRepository.GetUserByUsernameAsync(User.GetUsername());

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

        if (await _uow.Complete()) return Ok();

        return BadRequest("Problem deleting photo");
    }
}