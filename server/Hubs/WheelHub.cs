using System.Security.Cryptography;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using VertutaServer.Data;
using VertutaServer.Models;

namespace VertutaServer.Hubs;

public class WheelHub : Hub
{
    private const string DefaultRoom = "DEFAULT";
    private const string GroupName = $"room_{DefaultRoom}";

    private readonly AppDbContext _db;

    public WheelHub(AppDbContext db) => _db = db;

    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName);

        var room = await _db.Rooms.FirstOrDefaultAsync(r => r.RoomCode == DefaultRoom);
        if (room == null)
        {
            room = new Room { RoomCode = DefaultRoom, HostName = "System" };
            _db.Rooms.Add(room);
            await _db.SaveChangesAsync();
        }

        var variants = await _db.Variants
            .Where(v => v.RoomCode == DefaultRoom)
            .OrderBy(v => v.SortOrder)
            .Select(v => new VariantResponse(
                v.Id, v.ClientId, v.Name, v.Owner, v.IsMultiLayer, v.ParentId, v.SortOrder, v.CreatedAt
            ))
            .ToListAsync();

        await Clients.Caller.SendAsync("JoinedRoom", new { variants });

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName);
        await base.OnDisconnectedAsync(exception);
    }

    public async Task AddVariant(AddVariantRequest request)
    {
        var maxOrder = await _db.Variants
            .Where(v => v.RoomCode == DefaultRoom && v.ParentId == request.ParentVariantId)
            .MaxAsync(v => (int?)v.SortOrder) ?? 0;

        var variant = new Variant
        {
            ClientId = request.ClientId,
            RoomCode = DefaultRoom,
            ParentId = request.ParentVariantId,
            Name = request.Name,
            Owner = request.Owner,
            IsMultiLayer = request.IsMultiLayer,
            SortOrder = maxOrder + 1,
        };

        _db.Variants.Add(variant);
        await _db.SaveChangesAsync();

        var response = new VariantResponse(
            variant.Id, variant.ClientId, variant.Name, variant.Owner,
            variant.IsMultiLayer, variant.ParentId, variant.SortOrder, variant.CreatedAt
        );

        await Clients.Group(GroupName).SendAsync("VariantAdded", response);
    }

    public async Task UpdateVariant(UpdateVariantRequest request)
    {
        var variant = await _db.Variants
            .FirstOrDefaultAsync(v => v.Id == request.VariantId && v.RoomCode == DefaultRoom);

        if (variant == null)
        {
            await Clients.Caller.SendAsync("Error", "Variant not found");
            return;
        }

        if (request.Name != null) variant.Name = request.Name;
        if (request.Owner != null) variant.Owner = request.Owner == "" ? null : request.Owner;
        if (request.IsMultiLayer.HasValue) variant.IsMultiLayer = request.IsMultiLayer.Value;

        await _db.SaveChangesAsync();

        var response = new VariantResponse(
            variant.Id, variant.ClientId, variant.Name, variant.Owner,
            variant.IsMultiLayer, variant.ParentId, variant.SortOrder, variant.CreatedAt
        );

        await Clients.Group(GroupName).SendAsync("VariantUpdated", response);
    }

    public async Task RemoveVariant(RemoveVariantRequest request)
    {
        var variant = await _db.Variants
            .FirstOrDefaultAsync(v => v.Id == request.VariantId && v.RoomCode == DefaultRoom);

        if (variant == null) return;

        var descendantIds = await GetDescendantIds(request.VariantId);

        _db.Variants.Remove(variant);
        await _db.SaveChangesAsync();

        foreach (var id in descendantIds)
        {
            await Clients.Group(GroupName).SendAsync("VariantRemoved", id);
        }
        await Clients.Group(GroupName).SendAsync("VariantRemoved", request.VariantId);
    }

    public async Task<object> GetCurrentState()
    {
        var variants = await _db.Variants
            .Where(v => v.RoomCode == DefaultRoom)
            .OrderBy(v => v.SortOrder)
            .Select(v => new VariantResponse(
                v.Id, v.ClientId, v.Name, v.Owner, v.IsMultiLayer, v.ParentId, v.SortOrder, v.CreatedAt
            ))
            .ToListAsync();

        return new { variants };
    }

    private async Task<List<int>> GetDescendantIds(int parentId)
    {
        var result = new List<int>();
        var childIds = await _db.Variants
            .Where(v => v.ParentId == parentId)
            .Select(v => v.Id)
            .ToListAsync();

        foreach (var childId in childIds)
        {
            result.AddRange(await GetDescendantIds(childId));
            result.Add(childId);
        }

        return result;
    }

    public async Task RequestSpin(RequestSpinRequest request)
    {
        var variants = await _db.Variants
            .Where(v => v.RoomCode == DefaultRoom && v.ParentId == request.ParentVariantId)
            .OrderBy(v => v.SortOrder)
            .ToListAsync();

        if (variants.Count == 0)
        {
            await Clients.Caller.SendAsync("Error", "No variants to spin");
            return;
        }

        var index = RandomNumberGenerator.GetInt32(variants.Count);
        var winner = variants[index];
        var seed = RandomNumberGenerator.GetInt32(1_000_000) / 1_000_000.0;

        await Clients.Group(GroupName)
            .SendAsync("SpinStarted", new SpinStartedResponse(
                winner.ClientId, winner.Id, winner.Name, request.Duration, seed));
    }

    public async Task ConfirmRound(ConfirmRoundRequest request)
    {
        var variant = await _db.Variants
            .FirstOrDefaultAsync(v => v.Id == request.VariantId && v.RoomCode == DefaultRoom);

        if (variant != null)
        {
            _db.Variants.Remove(variant);
        }

        var sessionId = request.SessionId ?? "";

        if (!string.IsNullOrEmpty(sessionId))
        {
            var session = await _db.Sessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
            if (session == null)
            {
                session = new Session
                {
                    SessionId = sessionId,
                    Name = $"Session {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
                };
                _db.Sessions.Add(session);
            }
            session.TotalRounds = Math.Max(session.TotalRounds, request.Round);
        }

        var winRecord = new WinRecord
        {
            LotName = request.LotName,
            Owner = request.Owner,
            Round = request.Round,
            Path = request.Path,
            RoomCode = DefaultRoom,
            SessionId = sessionId,
        };

        _db.WinRecords.Add(winRecord);
        await _db.SaveChangesAsync();

        var winResponse = new WinRecordResponse(
            winRecord.Id, winRecord.LotName, winRecord.Owner,
            winRecord.Round, winRecord.Path, winRecord.Timestamp, winRecord.SessionId
        );

        await Clients.Group(GroupName).SendAsync("WinRecorded", winResponse);

        if (variant != null)
        {
            await Clients.Group(GroupName).SendAsync("VariantRemoved", request.VariantId);
        }
    }
}
