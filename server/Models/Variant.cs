using System.ComponentModel.DataAnnotations;

namespace VertutaServer.Models;

public class Variant
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string ClientId { get; set; } = "";

    [Required]
    [MaxLength(12)]
    public string RoomCode { get; set; } = "";

    public int? ParentId { get; set; }

    [Required]
    [MaxLength(300)]
    public string Name { get; set; } = "";

    [MaxLength(100)]
    public string? Owner { get; set; }

    public bool IsMultiLayer { get; set; }

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Room Room { get; set; } = null!;
    public Variant? Parent { get; set; }
    public ICollection<Variant> Children { get; set; } = new List<Variant>();
}
