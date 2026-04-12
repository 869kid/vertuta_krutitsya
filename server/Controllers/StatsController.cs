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

        var topWinners = await _db.WinRecords
            .Where(w => w.Owner != "")
            .GroupBy(w => w.Owner)
            .OrderByDescending(g => g.Count())
            .Take(10)
            .ToDictionaryAsync(g => g.Key, g => g.Count());

        var topLots = await _db.WinRecords
            .GroupBy(w => w.LotName)
            .OrderByDescending(g => g.Count())
            .Take(10)
            .ToDictionaryAsync(g => g.Key, g => g.Count());

        return Ok(new StatsResponse(totalSessions, totalWins, totalRounds, topWinners, topLots));
    }
}
