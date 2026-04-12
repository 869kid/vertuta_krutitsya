using Microsoft.EntityFrameworkCore;
using VertutaServer.Models;

namespace VertutaServer.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<WinRecord> WinRecords => Set<WinRecord>();
    public DbSet<Session> Sessions => Set<Session>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<WinRecord>(e =>
        {
            e.HasIndex(w => w.SessionId);
            e.HasIndex(w => w.Timestamp);
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
    }
}
