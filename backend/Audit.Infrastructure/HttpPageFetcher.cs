using Audit.Core.Interfaces;

namespace Audit.Infrastructure;

/// <summary>
/// Fetches raw HTML over HTTP. Stub — implemented in the logic phase.
/// </summary>
public sealed class HttpPageFetcher : IPageFetcher
{
    public Task<string> FetchAsync(string url, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();
}
