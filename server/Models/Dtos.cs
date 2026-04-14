namespace VertutaServer.Models;

public record CreateWinRecordDto(
    string LotName,
    string Owner,
    int Round,
    string[] Path,
    string SessionId
);

public record CreateSessionDto(string Name);

public record WinRecordResponse(
    int Id,
    string LotName,
    string Owner,
    int Round,
    string[] Path,
    DateTime Timestamp,
    string SessionId
);

public record SessionResponse(
    int Id,
    string SessionId,
    string Name,
    DateTime CreatedAt,
    int TotalRounds,
    int WinCount
);

public record SessionDetailResponse(
    int Id,
    string SessionId,
    string Name,
    DateTime CreatedAt,
    int TotalRounds,
    List<WinRecordResponse> WinRecords
);

public record StatsResponse(
    int TotalSessions,
    int TotalWins,
    int TotalRounds,
    Dictionary<string, int> TopWinners,
    Dictionary<string, int> TopLots
);

// Room DTOs

public record CreateRoomDto(string HostName, string? Password);

public record RoomResponse(
    string RoomCode,
    string HostName,
    bool HasPassword,
    int VariantCount,
    DateTime CreatedAt
);

// Variant DTOs

public record CreateVariantDto(
    string ClientId,
    string Name,
    string? Owner,
    bool IsMultiLayer,
    int? ParentVariantId
);

public record VariantResponse(
    int Id,
    string ClientId,
    string Name,
    string? Owner,
    bool IsMultiLayer,
    int? ParentId,
    int SortOrder,
    DateTime CreatedAt
);

// Hub DTOs

public record AddVariantRequest(
    string RoomCode,
    string ClientId,
    string Name,
    string? Owner,
    bool IsMultiLayer,
    int? ParentVariantId
);

public record RemoveVariantRequest(string RoomCode, int VariantId);

public record RecordWinRequest(
    string RoomCode,
    string LotName,
    string Owner,
    int Round,
    string[] Path,
    int VariantId
);

public record RequestSpinRequest(string RoomCode, double Duration, int? ParentVariantId);

public record SpinStartedResponse(string WinnerClientId, int WinnerId, string WinnerName, double Duration);

public record ConfirmRoundRequest(string RoomCode, int VariantId, string LotName, string Owner, int Round, string[] Path);
