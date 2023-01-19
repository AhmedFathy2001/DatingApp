using API.Data;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using Microsoft.EntityFrameworkCore;

namespace API.Interfaces;

public class LikesRepository : ILikeRepository
{
    private readonly DataContext _context;

    public LikesRepository(DataContext context)
    {
        _context = context;
    }

    public async Task<UserLike> GetUserLike(int sourceUserId, int targetUserId)
    {
        return await _context.Likes.FindAsync(sourceUserId, targetUserId);
    }

    public async Task<AppUser> GetUserWithLikes(int userId)
    {
        return await _context.Users.Include(user => user.LikedUsers)
            .FirstOrDefaultAsync(user => user.Id == userId);
    }

    public async Task<PagedList<LikeDto>> GetUserLikes(LikesParams likesParams)
    {
        var users = _context.Users.OrderBy(user => user.UserName).AsQueryable();
        var likes = _context.Likes.AsQueryable();

        if (likesParams.IsLiked)
        {
            likes = likes.Where(like => like.SourceUserId == likesParams.UserId);
            users = likes.Select(like => like.TargetUser);
        }
        else
        {
            likes = likes.Where(like => like.TargetUserId == likesParams.UserId);
            users = likes.Select(like => like.SourceUser);
        }


        var likedUsers = users.Select(user => new LikeDto
        {
            UserName = user.UserName,
            KnownAs = user.KnownAs,
            Age = user.DateOfBirth.CalculateAge(),
            PhotoUrl = user.Photos.FirstOrDefault(p => p.IsMain).Url,
            City = user.City,
            Id = user.Id,
            IsLiked = user.LikedByUsers.FirstOrDefault(u => u.SourceUserId == likesParams.UserId) != null
        });

        return await PagedList<LikeDto>.CreateAsync(
            likedUsers, likesParams.PageNumber, likesParams.PageSize);
    }

    public bool GetUserIsLiked(int userId, int sourceUserId)
    {
        var likes = _context.Likes.FirstOrDefault(like =>
            like.TargetUserId == userId && like.SourceUserId == sourceUserId);
        var isLiked = likes != null;

        return isLiked;
    }
}