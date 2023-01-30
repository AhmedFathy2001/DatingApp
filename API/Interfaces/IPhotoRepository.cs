using API.Entities;

namespace API.Interfaces;

public interface IPhotoRepository
{
    Task<List<Photo>> GetUnapprovedPhotos();

    Task<Photo> GetPhotoById(int id);

    Task RemovePhoto(int id);
}