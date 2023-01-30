using API.Entities;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class PhotoRepository : IPhotoRepository
{
    private readonly DataContext _context;

    public PhotoRepository(DataContext context)
    {
        _context = context;
    }

    public async Task<List<Photo>> GetUnapprovedPhotos()
    {
        return await _context.Photos.IgnoreQueryFilters()
            .Where(p => !p.IsApproved)
            .Include(p => p.AppUser)
            .ToListAsync();
    }

    public async Task<Photo> GetPhotoById(int id)
    {
        return await _context.Photos.IgnoreQueryFilters().Include(p => p.AppUser).SingleOrDefaultAsync(p => p.Id == id);
    }

    public async Task RemovePhoto(int id)
    {
        var photo = await _context.Photos.IgnoreQueryFilters().SingleOrDefaultAsync(p => p.Id == id);
        if (photo != null) _context.Remove(photo);
    }
}