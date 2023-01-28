using API.DTOs;
using API.Entities;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class UserRepository : IUserRepository
{
    private readonly DataContext _context;
    private readonly IMapper _mapper;

    public UserRepository(DataContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public void Update(AppUser user)
    {
        _context.Entry(user).State = EntityState.Modified;
    }

    public async Task<PagedList<MemberDto>> GetMembersAsync(UserParams userParams)
    {
        var query = _context.Users.AsQueryable();

        query = query.Where(user => user.UserName != userParams.CurrentUsername);

        query = query.Where(user => user.Gender == userParams.Gender);
        var minDob = DateOnly.FromDateTime(DateTime.Today.AddYears(-userParams.MaxAge - 1));
        var maxDob = DateOnly.FromDateTime(DateTime.Today.AddYears(-userParams.MinAge));

        query = query.Where(user => user.DateOfBirth >= minDob && user.DateOfBirth <= maxDob);

        if (userParams.SearchByUsername != null)
            query = query.Where(user => user.UserName.ToLower().Contains(userParams.SearchByUsername));

        query = userParams.OrderBy switch
        {
            "createdAt" => query.OrderByDescending(user => user.CreatedAt),
            _ => query.OrderByDescending(user => user.LastActive)
        };

        return await PagedList<MemberDto>
            .CreateAsync(
                query.AsNoTracking().ProjectTo<MemberDto>(_mapper.ConfigurationProvider),
                userParams.PageNumber,
                userParams.PageSize);
    }

    public async Task<MemberDto> GetMemberByIdAsync(int id)
    {
        return await _context.Users
            .Where(user => user.Id == id)
            .ProjectTo<MemberDto>(_mapper.ConfigurationProvider)
            .SingleOrDefaultAsync();
    }

    public async Task<MemberDto> GetMemberByUsernameAsync(string username)
    {
        return await _context.Users
            .Where(user => user.UserName == username)
            .ProjectTo<MemberDto>(_mapper.ConfigurationProvider)
            .SingleOrDefaultAsync();
    }

    public async Task<string> GetUserGender(string username)
    {
        return await _context.Users
            .Where(x => x.UserName == username)
            .Select(x => x.Gender)
            .FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<AppUser>> GetUsersAsync()
    {
        return await _context.Users
            .Include(user => user.Photos)
            .ToListAsync();
    }

    public async Task<AppUser> GetUserByIdAsync(int id)
    {
        return await _context.Users
            .FindAsync(id);
    }

    public async Task<AppUser> GetUserByUsernameAsync(string username)
    {
        return await _context.Users
            .Include(user => user.Photos)
            .SingleOrDefaultAsync(user => user.UserName == username);
    }
}