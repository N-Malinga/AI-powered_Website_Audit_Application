using FluentValidation;

namespace Audit.Core.Application;

/// <summary>
/// Validates the audit request URL: required, absolute, and http/https only.
/// </summary>
public sealed class AuditWebsiteCommandValidator : AbstractValidator<AuditWebsiteCommand>
{
    public AuditWebsiteCommandValidator()
    {
        RuleFor(x => x.Url)
            .NotEmpty().WithMessage("URL is required.")
            .Must(BeAbsoluteHttpUrl)
            .WithMessage("URL must be an absolute http or https URL.");
    }

    private static bool BeAbsoluteHttpUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return false;
        }

        return Uri.TryCreate(url, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }
}
