using System.Text.Json.Serialization;
using Audit.Api;
using Audit.Core;
using Audit.Core.Application;
using Audit.Infrastructure;
using MediatR;

var builder = WebApplication.CreateBuilder(args);

const string FrontendCorsPolicy = "frontend";

// Serialize enums (Severity, Priority) as strings so the response is self-descriptive.
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// CORS is locked to an explicit allow-list driven by configuration/env, never AllowAnyOrigin.
// Set CORS_ALLOWED_ORIGINS (comma-separated) in production, e.g. your Vercel domain.
// Falls back to local Vite dev origins when unset so local development keeps working.
var allowedOrigins = (builder.Configuration["CORS_ALLOWED_ORIGINS"]
        ?? "http://localhost:5173,http://127.0.0.1:5173")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
    options.AddPolicy(FrontendCorsPolicy, policy =>
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

// Application layer (MediatR + validation) and Infrastructure adapters.
builder.Services.AddApplication();
builder.Services.AddInfrastructure();

// RFC7807 problem details + global exception handling.
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors(FrontendCorsPolicy);

// Liveness probe.
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// Run a full audit for a single URL.
app.MapPost("/api/audit", async (AuditWebsiteCommand command, ISender sender, CancellationToken cancellationToken) =>
{
    var result = await sender.Send(command, cancellationToken);
    return Results.Ok(result);
});

app.Run();
