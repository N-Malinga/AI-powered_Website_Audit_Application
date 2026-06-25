using System.Text.Json.Serialization;
using Audit.Api;
using Audit.Core;
using Audit.Core.Application;
using Audit.Infrastructure;
using MediatR;

var builder = WebApplication.CreateBuilder(args);

const string DevCorsPolicy = "dev";

// Serialize enums (Severity, Priority) as strings so the response is self-descriptive.
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// Permissive CORS for local frontend development. Tightened in a later phase.
builder.Services.AddCors(options =>
    options.AddPolicy(DevCorsPolicy, policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

// Application layer (MediatR + validation) and Infrastructure adapters.
builder.Services.AddApplication();
builder.Services.AddInfrastructure();

// RFC7807 problem details + global exception handling.
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors(DevCorsPolicy);

// Liveness probe.
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// Run a full audit for a single URL.
app.MapPost("/api/audit", async (AuditWebsiteCommand command, ISender sender, CancellationToken cancellationToken) =>
{
    var result = await sender.Send(command, cancellationToken);
    return Results.Ok(result);
});

app.Run();
