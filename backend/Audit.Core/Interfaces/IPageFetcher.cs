namespace Audit.Core.Interfaces;

/// <summary>
/// Fetches the raw HTML for a given URL. Implemented in Infrastructure.
/// </summary>
public interface IPageFetcher
{
    /// <summary>Fetch the raw HTML at <paramref name="url"/>.</summary>
    Task<string> FetchAsync(string url, CancellationToken cancellationToken = default);
}
