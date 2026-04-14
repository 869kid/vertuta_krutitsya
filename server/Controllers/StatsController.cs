using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VertutaServer.Data;
using VertutaServer.Models;

namespace VertutaServer.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatsController : ControllerBase
{
    private readonly AppDbContext _db;

    public StatsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<StatsResponse>> GetStats()
    {
        var totalSessions = await _db.Sessions.CountAsync();
        var totalWins = await _db.WinRecords.CountAsync();
        var totalRounds = await _db.Sessions.SumAsync(s => s.TotalRounds);

        var topWinners = (await _db.WinRecords
            .Where(w => w.Owner != "")
            .GroupBy(w => w.Owner)
            .Select(g => new { g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToListAsync())
            .ToDictionary(x => x.Key, x => x.Count);

        var topLots = (await _db.WinRecords
            .GroupBy(w => w.LotName)
            .Select(g => new { g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToListAsync())
            .ToDictionary(x => x.Key, x => x.Count);

        return Ok(new StatsResponse(totalSessions, totalWins, totalRounds, topWinners, topLots));
    }
}
