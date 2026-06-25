using Microsoft.Extensions.DependencyInjection;

namespace Audit.Infrastructure;

/// <summary>
/// Single entry point for registering Infrastructure services with the DI container.
/// Registrations are added as each adapter's logic is implemented.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        // Adapters are registered here in the logic phase, e.g.:
        //   services.AddScoped<IPageFetcher, HttpPageFetcher>();
        //   services.AddScoped<IMetricsExtractor, AngleSharpMetricsExtractor>();
        //   services.AddScoped<IAiAnalyzer, GeminiAiAnalyzer>();
        //   services.AddSingleton<IPromptLogger, PromptLogger>();
        return services;
    }
}
