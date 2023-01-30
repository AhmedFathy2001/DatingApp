using API.DTOs;
using API.Entities;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

public class AdminController : BaseApiController
{
    private readonly IMediaUploadService _mediaUploadService;
    private readonly IUnitOfWork _uow;
    private readonly UserManager<AppUser> _userManager;

    public AdminController(UserManager<AppUser> userManager, IUnitOfWork uow, IMediaUploadService mediaUploadService)
    {
        _userManager = userManager;
        _uow = uow;
        _mediaUploadService = mediaUploadService;
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpGet("users-with-roles")]
    public async Task<ActionResult> GetUsersWithRoles()
    {
        var users = await _userManager.Users
            .OrderBy(u => u.UserName)
            .Select(u => new
            {
                u.Id,
                Username = u.UserName,
                Roles = u.UserRoles.Select(r => r.Role.Name).ToList()
            }).ToListAsync();

        return Ok(users);
    }

    [Authorize(Policy = "RequireAdminRole")]
    [HttpPost("edit-roles/{username}")]
    public async Task<ActionResult> EditRoles(string username, [FromQuery] string roles)
    {
        if (string.IsNullOrEmpty(roles)) return BadRequest("You must select at least one role");

        var selectedRoles = roles.Split(",").ToArray();

        var user = await _userManager.FindByNameAsync(username);

        if (user == null) return NotFound();

        var userRoles = await _userManager.GetRolesAsync(user);

        var result = await _userManager.AddToRolesAsync(user, selectedRoles.Except(userRoles));

        if (!result.Succeeded) return BadRequest("Failed to update roles.");

        result = await _userManager.RemoveFromRolesAsync(user, userRoles.Except(selectedRoles));

        if (!result.Succeeded) return BadRequest("Failed to update roles.");

        return Ok(await _userManager.GetRolesAsync(user));
    }

    [Authorize(Policy = "ModeratePhotoRole")]
    [HttpGet("photos-to-moderate")]
    public async Task<ActionResult<List<PhotoForApprovalDto>>> GetPhotosForApproval()
    {
        var photos = await _uow.PhotoRepository.GetUnapprovedPhotos();

        if (photos == null || !photos.Any()) return Ok();

        var photosDto = photos.Select(photo => new PhotoForApprovalDto
            { Id = photo.Id, Username = photo.AppUser.UserName, Url = photo.Url }).ToList();

        return Ok(photosDto);
    }

    [Authorize(Policy = "ModeratePhotoRole")]
    [HttpPost("approve-photo/{id:int}")]
    public async Task<ActionResult> ApprovePhoto(int id)
    {
        var photo = await _uow.PhotoRepository.GetPhotoById(id);

        if (photo == null) return NotFound();
        if (photo.IsApproved) return BadRequest("Photo is already approved.");

        photo.IsApproved = true;

        var mainPhoto = photo.AppUser.Photos.SingleOrDefault(p => p.IsMain);

        if (mainPhoto == null) photo.IsMain = true;

        if (!await _uow.Complete()) return BadRequest("Error approving photo");


        return Ok();
    }


    [Authorize(Policy = "ModeratePhotoRole")]
    [HttpDelete("reject-photo/{id:int}")]
    public async Task<ActionResult> RejectPhoto(int id)
    {
        var photo = await _uow.PhotoRepository.GetPhotoById(id);

        if (photo == null) return NotFound();
        if (photo.IsApproved) return BadRequest("Photo is already approved.");

        if (photo.PublicId != null)
        {
            var result = await _mediaUploadService.DeleteMediaAsync(new List<string>
            {
                photo.PublicId
            });

            foreach (var t in result.Where(t => t.Error != null))
                return BadRequest(t.Error.Message);
        }


        await _uow.PhotoRepository.RemovePhoto(id);

        if (!await _uow.Complete()) return BadRequest("Error rejecting photo");

        return Ok();
    }
}