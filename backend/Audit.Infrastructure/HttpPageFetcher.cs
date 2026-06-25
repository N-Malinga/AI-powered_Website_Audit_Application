using Audit.Core.Interfaces;

namespace Audit.Infrastructure;

/// <summary>
/// Fetches raw HTML over HTTP using a typed <see cref="HttpClient"/>. The timeout and a
/// realistic User-Agent are configured at registration time (see <see cref="DependencyInjection"/>).
/// </summary>
public sealed class HttpPageFetcher : IPageFetcher
{
    private readonly HttpClient _httpClient;

    public HttpPageFetcher(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<string> FetchAsync(string url, CancellationToken cancellationToken = default)
    {
        using var response = await _httpClient.GetAsync(url, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync(cancellationToken);
    }
}
