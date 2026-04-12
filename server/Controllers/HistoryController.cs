using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VertutaServer.Data;
using VertutaServer.Models;

namespace VertutaServer.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HistoryController : ControllerBase
{
    private readonly AppDbContext _db;

    public HistoryController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<WinRecordResponse>>> GetAll(
        [FromQuery] string? sessionId,
        [FromQuery] int limit = 100,
        [FromQuery] int offset = 0)
    {
        var query = _db.WinRecords.AsQueryable();

        if (!string.IsNullOrEmpty(sessionId))
            query = query.Where(w => w.SessionId == sessionId);

        var records = await query
            .OrderByDescending(w => w.Timestamp)
            .Skip(offset)
            .Take(limit)
            .Select(w => new WinRecordResponse(
                w.Id, w.LotName, w.Owner, w.Round, w.Path, w.Timestamp, w.SessionId
            ))
            .ToListAsync();

        return Ok(records);
    }

    [HttpPost]
    public async Task<ActionResult<WinRecordResponse>> Create([FromBody] CreateWinRecordDto dto)
    {
        var session = await _db.Sessions
            .FirstOrDefaultAsync(s => s.SessionId == dto.SessionId);

        if (session == null)
        {
            session = new Session
            {
                SessionId = dto.SessionId,
                Name = $"Session {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
            };
            _db.Sessions.Add(session);
        }

        session.TotalRounds = Math.Max(session.TotalRounds, dto.Round);

        var record = new WinRecord
        {
            LotName = dto.LotName,
            Owner = dto.Owner,
            Round = dto.Round,
            Path = dto.Path,
            SessionId = dto.SessionId,
            Timestamp = DateTime.UtcNow,
        };

        _db.WinRecords.Add(record);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new
        {
            record.Id, record.LotName, record.Owner, record.Round,
            record.Path, record.Timestamp, record.SessionId,
        });
    }

    [HttpDelete]
    public async Task<IActionResult> ClearAll([FromQuery] string? sessionId)
    {
        if (!string.IsNullOrEmpty(sessionId))
        {
            var count = await _db.WinRecords
                .Where(w => w.SessionId == sessionId)
                .ExecuteDeleteAsync();
            return Ok(new { deleted = count });
        }

        var total = await _db.WinRecords.ExecuteDeleteAsync();
        return Ok(new { deleted = total });
    }
}
