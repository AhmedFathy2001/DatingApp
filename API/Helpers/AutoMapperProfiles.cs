using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using AutoMapper;

namespace API.Helpers;

public class AutoMapperProfiles : Profile
{
    private readonly ILikeRepository _likeRepository;

    public AutoMapperProfiles(ILikeRepository likeRepository)
    {
        _likeRepository = likeRepository;
    }

    public AutoMapperProfiles()
    {
        CreateMap<AppUser, MemberDto>()
            .ForMember(dest => dest.PhotoUrl,
                opt => opt.MapFrom(src => src.Photos
                    .FirstOrDefault(photo => photo.IsMain).Url))
            .ForMember(dest => dest.Age,
                opt => opt.MapFrom(
                    src => src.DateOfBirth.CalculateAge()));
        CreateMap<Photo, PhotoDto>();
        CreateMap<MemberUpdateDto, AppUser>();
        CreateMap<RegisterDto, AppUser>();
        CreateMap<Message, MessageDto>()
            .ForMember(d => d.SenderPhotoUrl,
                o => o.MapFrom(
                    s => s.Sender.Photos
                        .FirstOrDefault(u => u.IsMain).Url)).ForMember(d => d.RecipientPhotoUrl,
                o => o.MapFrom(
                    r => r.Recipient.Photos
                        .FirstOrDefault(u => u.IsMain).Url)).ForMember(d => d.RecipientPhotoUrl,
                o => o.MapFrom(
                    r => r.Recipient.Photos
                        .FirstOrDefault(u => u.IsMain).Url)).ForMember(dto => dto.Media,
                opt => opt.MapFrom(m => m.Media.ToList()));
        ;
    }
}