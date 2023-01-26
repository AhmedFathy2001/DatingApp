using CloudinaryDotNet.Actions;

namespace API.Interfaces;

public interface IMediaUploadService
{
    Task<ImageUploadResult> AddPhotoAsync(IFormFile file, bool isProfilePicture);

    Task<List<DeletionResult>> DeleteMediaAsync(IEnumerable<string> publicId);

    Task<VideoUploadResult> AddVideoAsync(IFormFile file);
}