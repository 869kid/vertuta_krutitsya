using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VertutaServer.Data;
using VertutaServer.Models;

namespace VertutaServer.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomController : ControllerBase
{
    private readonly AppDbContext _db;

    public RoomController(AppDbContext db) => _db = db;

    [HttpPost]
    public async Task<ActionResult<RoomResponse>> Create([FromBody] CreateRoomDto dto)
    {
        var room = new Room
        {
            HostName = dto.HostName,
            PasswordHash = string.IsNullOrEmpty(dto.Password) ? null : BCrypt.Net.BCrypt.HashPassword(dto.Password),
        };

        _db.Rooms.Add(room);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetByCode), new { roomCode = room.RoomCode },
            new RoomResponse(room.RoomCode, room.HostName, room.PasswordHash != null, 0, room.CreatedAt));
    }

    [HttpGet("{roomCode}")]
    public async Task<ActionResult<RoomResponse>> GetByCode(string roomCode)
    {
        var room = await _db.Rooms
            .Include(r => r.Variants)
            .FirstOrDefaultAsync(r => r.RoomCode == roomCode);

        if (room == null) return NotFound();

        return Ok(new RoomResponse(
            room.RoomCode, room.HostName, room.PasswordHash != null,
            room.Variants.Count, room.CreatedAt));
    }

    [HttpGet("{roomCode}/history")]
    public async Task<ActionResult<List<WinRecordResponse>>> GetHistory(
        string roomCode,
        [FromQuery] int limit = 100,
        [FromQuery] int offset = 0)
    {
        var records = await _db.WinRecords
            .Where(w => w.RoomCode == roomCode)
            .OrderByDescending(w => w.Timestamp)
            .Skip(offset)
            .Take(limit)
            .Select(w => new WinRecordResponse(
                w.Id, w.LotName, w.Owner, w.Round, w.Path, w.Timestamp, w.SessionId
            ))
            .ToListAsync();

        return Ok(records);
    }
}
