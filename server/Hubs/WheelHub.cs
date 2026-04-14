using System.Collections.Concurrent;
using System.Security.Cryptography;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using VertutaServer.Data;
using VertutaServer.Models;

namespace VertutaServer.Hubs;

public class WheelHub : Hub
{
    private static readonly ConcurrentDictionary<string, string> RoomHosts = new();

    private readonly AppDbContext _db;

    public WheelHub(AppDbContext db) => _db = db;

    public async Task JoinRoom(string roomCode, string? password)
    {
        var room = await _db.Rooms.FirstOrDefaultAsync(r => r.RoomCode == roomCode);
        if (room == null)
        {
            await Clients.Caller.SendAsync("Error", "Room not found");
            return;
        }

        if (room.PasswordHash != null)
        {
            if (string.IsNullOrEmpty(password) || !BCrypt.Net.BCrypt.Verify(password, room.PasswordHash))
            {
                await Clients.Caller.SendAsync("Error", "Invalid password");
                return;
            }
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"room_{roomCode}");

        var isHost = !RoomHosts.ContainsKey(roomCode);
        if (isHost)
            RoomHosts[roomCode] = Context.ConnectionId;

        var variants = await _db.Variants
            .Where(v => v.RoomCode == roomCode)
            .OrderBy(v => v.SortOrder)
            .Select(v => new VariantResponse(
                v.Id, v.ClientId, v.Name, v.Owner, v.IsMultiLayer, v.ParentId, v.SortOrder, v.CreatedAt
            ))
            .ToListAsync();

        await Clients.Caller.SendAsync("JoinedRoom", new
        {
            roomCode,
            hostName = room.HostName,
            isHost,
            variants,
        });
    }

    public async Task LeaveRoom(string roomCode)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"room_{roomCode}");

        if (RoomHosts.TryGetValue(roomCode, out var hostConn) && hostConn == Context.ConnectionId)
            RoomHosts.TryRemove(roomCode, out _);
    }

    public async Task AddVariant(AddVariantRequest request)
    {
        var room = await _db.Rooms.FirstOrDefaultAsync(r => r.RoomCode == request.RoomCode);
        if (room == null)
        {
            await Clients.Caller.SendAsync("Error", "Room not found");
            return;
        }

        var maxOrder = await _db.Variants
            .Where(v => v.RoomCode == request.RoomCode && v.ParentId == request.ParentVariantId)
            .MaxAsync(v => (int?)v.SortOrder) ?? 0;

        var variant = new Variant
        {
            ClientId = request.ClientId,
            RoomCode = request.RoomCode,
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

        await Clients.Group($"room_{request.RoomCode}").SendAsync("VariantAdded", response);
    }

    public async Task RemoveVariant(RemoveVariantRequest request)
    {
        if (!IsHost(request.RoomCode))
        {
            await Clients.Caller.SendAsync("Error", "Only the host can remove variants");
            return;
        }

        var variant = await _db.Variants
            .FirstOrDefaultAsync(v => v.Id == request.VariantId && v.RoomCode == request.RoomCode);

        if (variant == null) return;

        _db.Variants.Remove(variant);
        await _db.SaveChangesAsync();

        await Clients.Group($"room_{request.RoomCode}")
            .SendAsync("VariantRemoved", request.VariantId);
    }

    public async Task RecordWin(RecordWinRequest request)
    {
        if (!IsHost(request.RoomCode))
        {
            await Clients.Caller.SendAsync("Error", "Only the host can record wins");
            return;
        }

        var variant = await _db.Variants
            .FirstOrDefaultAsync(v => v.Id == request.VariantId && v.RoomCode == request.RoomCode);

        if (variant != null)
        {
            _db.Variants.Remove(variant);
        }

        var winRecord = new WinRecord
        {
            LotName = request.LotName,
            Owner = request.Owner,
            Round = request.Round,
            Path = request.Path,
            RoomCode = request.RoomCode,
            SessionId = "",
        };

        _db.WinRecords.Add(winRecord);
        await _db.SaveChangesAsync();

        var winResponse = new WinRecordResponse(
            winRecord.Id, winRecord.LotName, winRecord.Owner,
            winRecord.Round, winRecord.Path, winRecord.Timestamp, winRecord.SessionId
        );

        await Clients.Group($"room_{request.RoomCode}")
            .SendAsync("WinRecorded", winResponse);

        if (variant != null)
        {
            await Clients.Group($"room_{request.RoomCode}")
                .SendAsync("VariantRemoved", request.VariantId);
        }
    }

    public async Task RequestSpin(RequestSpinRequest request)
    {
        if (!IsHost(request.RoomCode))
        {
            await Clients.Caller.SendAsync("Error", "Only the host can start a spin");
            return;
        }

        var variants = await _db.Variants
            .Where(v => v.RoomCode == request.RoomCode && v.ParentId == request.ParentVariantId)
            .OrderBy(v => v.SortOrder)
            .ToListAsync();

        if (variants.Count == 0)
        {
            await Clients.Caller.SendAsync("Error", "No variants to spin");
            return;
        }

        var index = RandomNumberGenerator.GetInt32(variants.Count);
        var winner = variants[index];

        await Clients.Group($"room_{request.RoomCode}")
            .SendAsync("SpinStarted", new SpinStartedResponse(
                winner.ClientId, winner.Id, winner.Name, request.Duration));
    }

    public async Task ConfirmRound(ConfirmRoundRequest request)
    {
        if (!IsHost(request.RoomCode))
        {
            await Clients.Caller.SendAsync("Error", "Only the host can record wins");
            return;
        }

        var variant = await _db.Variants
            .FirstOrDefaultAsync(v => v.Id == request.VariantId && v.RoomCode == request.RoomCode);

        if (variant != null)
        {
            _db.Variants.Remove(variant);
        }

        var winRecord = new WinRecord
        {
            LotName = request.LotName,
            Owner = request.Owner,
            Round = request.Round,
            Path = request.Path,
            RoomCode = request.RoomCode,
            SessionId = "",
        };

        _db.WinRecords.Add(winRecord);
        await _db.SaveChangesAsync();

        var winResponse = new WinRecordResponse(
            winRecord.Id, winRecord.LotName, winRecord.Owner,
            winRecord.Round, winRecord.Path, winRecord.Timestamp, winRecord.SessionId
        );

        await Clients.Group($"room_{request.RoomCode}")
            .SendAsync("WinRecorded", winResponse);

        if (variant != null)
        {
            await Clients.Group($"room_{request.RoomCode}")
                .SendAsync("VariantRemoved", request.VariantId);
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var disconnected = Context.ConnectionId;
        foreach (var kvp in RoomHosts)
        {
            if (kvp.Value == disconnected)
                RoomHosts.TryRemove(kvp.Key, out _);
        }

        await base.OnDisconnectedAsync(exception);
    }

    private bool IsHost(string roomCode) =>
        RoomHosts.TryGetValue(roomCode, out var hostConn) && hostConn == Context.ConnectionId;
}
