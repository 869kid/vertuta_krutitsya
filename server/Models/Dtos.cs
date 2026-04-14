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

// Variant DTOs

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
    string ClientId,
    string Name,
    string? Owner,
    bool IsMultiLayer,
    int? ParentVariantId
);

public record UpdateVariantRequest(
    int VariantId,
    string? Name,
    string? Owner,
    bool? IsMultiLayer
);

public record RemoveVariantRequest(int VariantId);

public record RequestSpinRequest(double Duration, int? ParentVariantId);

public record SpinStartedResponse(string WinnerClientId, int WinnerId, string WinnerName, double Duration, double Seed);

public record ConfirmRoundRequest(int VariantId, string LotName, string Owner, int Round, string[] Path);
