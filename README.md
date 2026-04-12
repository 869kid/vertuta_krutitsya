# Vertuta Krutitsya

Wheel-of-fortune app for streamers. Fork of [Pointauc](https://github.com/Pointauc/pointauc_frontend) stripped down to the wheel, with history tracking and matryoshka mode.

## Tech Stack

**Frontend**

- React 19 + Vite + TypeScript
- Redux Toolkit
- Mantine 8
- Tailwind / CSS-Modules
- i18next

**Backend**

- .NET 9 (ASP.NET Core)
- Entity Framework Core + PostgreSQL
- Swagger / OpenAPI

## Getting Started

### Prerequisites

- **Node.js >= 22**
- **pnpm**

### Frontend

```bash
pnpm install
pnpm dev
```

Dev server starts at `http://localhost:5173`.

### Server

There are two ways to run the backend: via Docker Compose (recommended) or manually.

#### Option 1 — Docker Compose (server + database)

Requires **Docker** and **Docker Compose**.

```bash
docker compose up -d
```

This starts:

| Service    | Port   | Description                    |
|------------|--------|--------------------------------|
| `db`       | 5432   | PostgreSQL 16                  |
| `server`   | 8080   | .NET API (auto-runs migrations)|

Swagger UI is available at `http://localhost:8080/swagger`.

To stop everything:

```bash
docker compose down
```

To wipe the database volume and start fresh:

```bash
docker compose down -v
```

#### Option 2 — Run manually

Requires **.NET 9 SDK** and a running **PostgreSQL** instance.

1. Make sure PostgreSQL is running and the connection string in `server/appsettings.json` is correct (default: `Host=localhost;Port=5432;Database=vertuta;Username=vertuta;Password=vertuta`).

2. Run the server:

```bash
cd server
dotnet run
```

The server applies EF Core migrations on startup automatically, so no separate `dotnet ef database update` step is needed.

API will be at `http://localhost:5062` (HTTPS on 7062), Swagger at the same address under `/swagger`.

### Environment variables

| Variable | Where | Description |
|----------|-------|-------------|
| `ConnectionStrings__DefaultConnection` | server | PostgreSQL connection string (overrides appsettings) |
