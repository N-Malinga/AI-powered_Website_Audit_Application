using Audit.Core.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace Audit.Infrastructure;

/// <summary>
/// Single entry point for registering Infrastructure services with the DI container.
/// The adapters are currently stubs that throw until their logic lands.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddScoped<IPageFetcher, HttpPageFetcher>();
        services.AddScoped<IMetricsExtractor, AngleSharpMetricsExtractor>();
        services.AddScoped<IAiAnalyzer, GeminiAiAnalyzer>();
        services.AddSingleton<IPromptLogger, PromptLogger>();
        return services;
    }
}
