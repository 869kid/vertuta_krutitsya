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
