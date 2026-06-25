using Audit.Core.Models;
using Audit.Infrastructure;
using Xunit;

namespace Audit.Tests;

public class AngleSharpMetricsExtractorTests
{
    private readonly AngleSharpMetricsExtractor _extractor = new();

    [Fact]
    public void Counts_multiple_headings_at_each_level()
    {
        const string html = """
            <html><body>
                <h1>First</h1>
                <h1>Second</h1>
                <h2>A</h2><h2>B</h2><h2>C</h2>
                <h3>Only</h3>
            </body></html>
            """;

        var metrics = _extractor.Extract(html);

        Assert.Equal(2, metrics.H1Count);
        Assert.Equal(3, metrics.H2Count);
        Assert.Equal(1, metrics.H3Count);
    }

    [Fact]
    public void Counts_images_missing_alt_and_rounds_percentage()
    {
        // 1 of 3 images missing alt -> 33.33% (whitespace-only alt counts as missing).
        const string html = """
            <html><body>
                <img src="a.png" alt="A descriptive caption" />
                <img src="b.png" alt="   " />
                <img src="c.png" alt="Another caption" />
            </body></html>
            """;

        var metrics = _extractor.Extract(html);

        Assert.Equal(3, metrics.ImageCount);
        Assert.Equal(1, metrics.ImagesMissingAltCount);
        Assert.Equal(33.33, metrics.ImagesMissingAltPercent, 2);
    }

    [Fact]
    public void Classifies_internal_and_external_links_against_page_host()
    {
        const string html = """
            <html>
            <head><link rel="canonical" href="https://example.com/" /></head>
            <body>
                <a href="/about">Relative internal</a>
                <a href="https://example.com/contact">Absolute internal</a>
                <a href="https://www.example.com/blog">Internal via www</a>
                <a href="https://other.com/page">External</a>
                <a href="mailto:hi@example.com">Email (ignored)</a>
                <a href="#top">Fragment internal</a>
            </body>
            </html>
            """;

        var metrics = _extractor.Extract(html);

        Assert.Equal(4, metrics.InternalLinks);
        Assert.Equal(1, metrics.ExternalLinks);
    }

    [Fact]
    public void Returns_null_meta_description_when_absent()
    {
        const string html = """
            <html><head><title>Home Page</title></head><body><p>Hi</p></body></html>
            """;

        var metrics = _extractor.Extract(html);

        Assert.Equal("Home Page", metrics.MetaTitle);
        Assert.Null(metrics.MetaDescription);
    }

    [Fact]
    public void Reads_meta_description_when_present()
    {
        const string html = """
            <html><head>
                <title>Home</title>
                <meta name="description" content="We build great things." />
            </head><body></body></html>
            """;

        var metrics = _extractor.Extract(html);

        Assert.Equal("We build great things.", metrics.MetaDescription);
    }

    [Fact]
    public void Empty_body_yields_all_zero_metrics()
    {
        const string html = "<html><head><title>T</title></head><body></body></html>";

        var metrics = _extractor.Extract(html);

        Assert.Equal(0, metrics.WordCount);
        Assert.Equal(0, metrics.H1Count);
        Assert.Equal(0, metrics.H2Count);
        Assert.Equal(0, metrics.H3Count);
        Assert.Equal(0, metrics.CtaCount);
        Assert.Equal(0, metrics.InternalLinks);
        Assert.Equal(0, metrics.ExternalLinks);
        Assert.Equal(0, metrics.ImageCount);
        Assert.Equal(0, metrics.ImagesMissingAltCount);
        Assert.Equal(0d, metrics.ImagesMissingAltPercent);
        Assert.Equal("T", metrics.MetaTitle);
        Assert.Null(metrics.MetaDescription);
    }

    [Fact]
    public void Word_count_excludes_script_style_and_noscript_text()
    {
        const string html = """
            <html><body>
                <p>Hello visible world</p>
                <script>var ignored = "one two three four";</script>
                <style>.ignored { color: red red red; }</style>
                <noscript>please enable javascript now</noscript>
            </body></html>
            """;

        var metrics = _extractor.Extract(html);

        Assert.Equal(3, metrics.WordCount);
    }

    [Fact]
    public void Counts_buttons_and_action_anchors_as_ctas()
    {
        // button + role=button anchor + class anchor + text-phrase anchor = 4; plain link excluded.
        const string html = """
            <html><body>
                <button>Submit</button>
                <a href="/x" role="button">Toggle</a>
                <a href="/y" class="btn btn-primary">Styled</a>
                <a href="/signup">Sign up today</a>
                <a href="/home">Home</a>
            </body></html>
            """;

        var metrics = _extractor.Extract(html);

        Assert.Equal(4, metrics.CtaCount);
    }
}
