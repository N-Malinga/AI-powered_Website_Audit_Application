using Audit.Core.Models;
using MediatR;

namespace Audit.Core.Application;

/// <summary>
/// Request to audit a single page at <paramref name="Url"/>, returning the full
/// <see cref="AuditResult"/> (metrics + AI analysis).
/// </summary>
public sealed record AuditWebsiteCommand(string Url) : IRequest<AuditResult>;
