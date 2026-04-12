using System.ComponentModel.DataAnnotations;

namespace VertutaServer.Models;

public class Session
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string SessionId { get; set; } = Guid.NewGuid().ToString("N")[..12];

    [MaxLength(200)]
    public string Name { get; set; } = "";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int TotalRounds { get; set; }

    public ICollection<WinRecord> WinRecords { get; set; } = new List<WinRecord>();
}
