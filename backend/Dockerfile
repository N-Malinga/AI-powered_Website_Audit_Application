# syntax=docker/dockerfile:1

# ---- Build stage: full .NET 10 SDK ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files first and restore so layers cache across source-only changes.
COPY Audit.slnx ./
COPY Audit.Api/Audit.Api.csproj Audit.Api/
COPY Audit.Core/Audit.Core.csproj Audit.Core/
COPY Audit.Infrastructure/Audit.Infrastructure.csproj Audit.Infrastructure/
COPY Audit.Tests/Audit.Tests.csproj Audit.Tests/
RUN dotnet restore Audit.Api/Audit.Api.csproj

# Copy the rest of the source and publish a release build.
COPY . .
RUN dotnet publish Audit.Api/Audit.Api.csproj -c Release -o /app --no-restore

# ---- Runtime stage: lean ASP.NET runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app .

# Render injects $PORT at runtime; bind Kestrel to it (default 8080 for local runs).
# Shell form so ${PORT} is expanded by the container's shell, not at build time.
ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://+:${PORT:-8080} exec dotnet Audit.Api.dll"]
