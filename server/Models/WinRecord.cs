using System.ComponentModel.DataAnnotations;

namespace VertutaServer.Models;

public class WinRecord
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string LotName { get; set; } = "";

    [MaxLength(100)]
    public string Owner { get; set; } = "";

    public int Round { get; set; }

    public string[] Path { get; set; } = [];

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [MaxLength(100)]
    public string SessionId { get; set; } = "";
}
