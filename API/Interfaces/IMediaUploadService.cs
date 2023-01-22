using CloudinaryDotNet.Actions;

namespace API.Interfaces;

public interface IMediaUploadService
{
    Task<ImageUploadResult> AddPhotoAsync(IFormFile file);

    Task<DeletionResult> DeletePhotoAsync(string publicId);

    Task<VideoUploadResult> AddVideoAsync(IFormFile file);
}