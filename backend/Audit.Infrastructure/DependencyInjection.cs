using Audit.Core.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace Audit.Infrastructure;

/// <summary>
/// Single entry point for registering Infrastructure services with the DI container.
/// The adapters are currently stubs that throw until their logic lands.
/// </summary>
public static class DependencyInjection
{
    // Sent so target sites treat us like a normal desktop browser rather than a bot.
    private const string UserAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddHttpClient<IPageFetcher, HttpPageFetcher>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.UserAgent.ParseAdd(UserAgent);
        });

        services.AddScoped<IMetricsExtractor, AngleSharpMetricsExtractor>();
        services.AddScoped<IAiAnalyzer, GeminiAiAnalyzer>();
        services.AddSingleton<IPromptLogger, PromptLogger>();
        return services;
    }
}
