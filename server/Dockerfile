FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY VertutaServer.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app .
RUN adduser --disabled-password --no-create-home appuser
USER appuser
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "VertutaServer.dll"]
