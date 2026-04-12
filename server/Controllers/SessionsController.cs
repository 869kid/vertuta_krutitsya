using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VertutaServer.Data;
using VertutaServer.Models;

namespace VertutaServer.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SessionsController : ControllerBase
{
    private readonly AppDbContext _db;

    public SessionsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<SessionResponse>>> GetAll()
    {
        var sessions = await _db.Sessions
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new SessionResponse(
                s.Id,
                s.SessionId,
                s.Name,
                s.CreatedAt,
                s.TotalRounds,
                s.WinRecords.Count
            ))
            .ToListAsync();

        return Ok(sessions);
    }

    [HttpGet("{sessionId}")]
    public async Task<ActionResult<SessionDetailResponse>> GetBySessionId(string sessionId)
    {
        var session = await _db.Sessions
            .Include(s => s.WinRecords)
            .FirstOrDefaultAsync(s => s.SessionId == sessionId);

        if (session == null) return NotFound();

        var detail = new SessionDetailResponse(
            session.Id,
            session.SessionId,
            session.Name,
            session.CreatedAt,
            session.TotalRounds,
            session.WinRecords
                .OrderByDescending(w => w.Timestamp)
                .Select(w => new WinRecordResponse(
                    w.Id, w.LotName, w.Owner, w.Round, w.Path, w.Timestamp, w.SessionId
                ))
                .ToList()
        );

        return Ok(detail);
    }

    [HttpPost]
    public async Task<ActionResult<SessionResponse>> Create([FromBody] CreateSessionDto dto)
    {
        var session = new Session { Name = dto.Name };
        _db.Sessions.Add(session);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBySessionId),
            new { sessionId = session.SessionId },
            new SessionResponse(session.Id, session.SessionId, session.Name, session.CreatedAt, 0, 0));
    }

    [HttpDelete("{sessionId}")]
    public async Task<IActionResult> Delete(string sessionId)
    {
        var session = await _db.Sessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
        if (session == null) return NotFound();

        _db.Sessions.Remove(session);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
