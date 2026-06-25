using Audit.Core.Application;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace Audit.Core;

/// <summary>
/// Registers the application layer (MediatR handlers, FluentValidation validators, and the
/// validation pipeline behavior). Adapters live in Audit.Infrastructure.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;

        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(assembly));
        services.AddValidatorsFromAssembly(assembly);
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        return services;
    }
}
