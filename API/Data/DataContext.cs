using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class DataContext : IdentityDbContext<AppUser, AppRole, int,
    IdentityUserClaim<int>, AppUserRole,
    IdentityUserLogin<int>, IdentityRoleClaim<int>
    , IdentityUserToken<int>>
{
    public DataContext(DbContextOptions options) : base(options)
    {
    }


    public DbSet<Photo> Photos { get; set; }

    public DbSet<UserLike> Likes { get; set; }

    public DbSet<Message> Messages { get; set; }

    public DbSet<Group> Groups { get; set; }
    public DbSet<Connection> Connections { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<AppUser>()
            .HasMany(ur => ur.UserRoles)
            .WithOne(u => u.User)
            .HasForeignKey(ur => ur.UserId)
            .IsRequired();

        builder.Entity<AppRole>()
            .HasMany(ur => ur.UserRoles)
            .WithOne(u => u.Role)
            .HasForeignKey(ur => ur.RoleId)
            .IsRequired();

        builder.Entity<UserLike>()
            .HasKey(key => new { key.SourceUserId, key.TargetUserId });

        builder.Entity<UserLike>()
            .HasOne(source => source.SourceUser)
            .WithMany(likes => likes.LikedUsers)
            .HasForeignKey(source => source.SourceUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<UserLike>()
            .HasOne(source => source.TargetUser)
            .WithMany(likes => likes.LikedByUsers)
            .HasForeignKey(source => source.TargetUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Message>()
            .HasOne(user => user.Recipient)
            .WithMany(message => message.MessagesReceived)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Message>()
            .HasOne(user => user.Sender)
            .WithMany(message => message.MessagesSent)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Photo>().HasQueryFilter(p => p.IsApproved);
    }
}