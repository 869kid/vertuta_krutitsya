using System.ComponentModel.DataAnnotations;

namespace VertutaServer.Models;

public class Room
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(12)]
    public string RoomCode { get; set; } = Guid.NewGuid().ToString("N")[..8].ToUpper();

    [Required]
    [MaxLength(100)]
    public string HostName { get; set; } = "";

    [MaxLength(200)]
    public string? PasswordHash { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Variant> Variants { get; set; } = new List<Variant>();

    public ICollection<WinRecord> WinRecords { get; set; } = new List<WinRecord>();
}
