using Audit.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

const string DevCorsPolicy = "dev";

// Permissive CORS for local frontend development. Tightened in the logic phase.
builder.Services.AddCors(options =>
    options.AddPolicy(DevCorsPolicy, policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

// Infrastructure adapters (currently a no-op registration stub).
builder.Services.AddInfrastructure();

var app = builder.Build();

app.UseCors(DevCorsPolicy);

// Liveness probe.
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// POST /api/audit is added in the logic phase.

app.Run();
