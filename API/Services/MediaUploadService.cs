using API.Helpers;
using API.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;

namespace API.Services;

public class MediaUploadService : IMediaUploadService
{
    private readonly Cloudinary _cloudinary;

    public MediaUploadService(IOptions<CloudinarySettings> config)
    {
        var account = new Account(
            config.Value.CloudName,
            config.Value.ApiKey,
            config.Value.ApiSecret
        );

        _cloudinary = new Cloudinary(account);
    }

    public async Task<List<DeletionResult>> DeleteMediaAsync(IEnumerable<string> publicIds)
    {
        var deletionResult = new List<DeletionResult>();
        foreach (var publicId in publicIds)
        {
            var deleteParams = new DeletionParams(publicId);
            var delete = await _cloudinary.DestroyAsync(deleteParams);

            deletionResult.Add(delete);
        }

        return deletionResult;
    }

    public async Task<VideoUploadResult> AddVideoAsync(IFormFile file)
    {
        var uploadResult = new VideoUploadResult();

        if (file.Length <= 0) return uploadResult;

        await using var stream = file.OpenReadStream();
        var uploadParams = new VideoUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = "dating-app"
        };
        uploadResult = await _cloudinary.UploadAsync(uploadParams);

        return uploadResult;
    }

    public async Task<ImageUploadResult> AddPhotoAsync(IFormFile file, bool isProfilePicture)
    {
        var uploadResult = new ImageUploadResult();

        if (file is not { Length: > 0 }) return uploadResult;

        await using var stream = file.OpenReadStream();
        var transformation = isProfilePicture
            ? new Transformation().Height(500).Width(500).Crop("fill").Gravity("face")
            : null;
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Transformation = transformation,
            Folder = "dating-app"
        };
        uploadResult = await _cloudinary.UploadAsync(uploadParams);

        return uploadResult;
    }
}