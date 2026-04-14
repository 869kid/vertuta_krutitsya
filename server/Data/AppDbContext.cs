using Microsoft.EntityFrameworkCore;
using VertutaServer.Models;

namespace VertutaServer.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<WinRecord> WinRecords => Set<WinRecord>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<Variant> Variants => Set<Variant>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<WinRecord>(e =>
        {
            e.HasIndex(w => w.SessionId);
            e.HasIndex(w => w.Timestamp);
            e.HasIndex(w => w.RoomCode);
        });

        modelBuilder.Entity<Session>(e =>
        {
            e.HasIndex(s => s.SessionId).IsUnique();
            e.HasMany(s => s.WinRecords)
             .WithOne()
             .HasForeignKey(w => w.SessionId)
             .HasPrincipalKey(s => s.SessionId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Room>(e =>
        {
            e.HasIndex(r => r.RoomCode).IsUnique();
            e.HasMany(r => r.Variants)
             .WithOne(v => v.Room)
             .HasForeignKey(v => v.RoomCode)
             .HasPrincipalKey(r => r.RoomCode)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasMany(r => r.WinRecords)
             .WithOne()
             .HasForeignKey(w => w.RoomCode)
             .HasPrincipalKey(r => r.RoomCode)
             .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Variant>(e =>
        {
            e.HasIndex(v => v.RoomCode);
            e.HasIndex(v => v.ClientId);
            e.HasOne(v => v.Parent)
             .WithMany(v => v.Children)
             .HasForeignKey(v => v.ParentId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
