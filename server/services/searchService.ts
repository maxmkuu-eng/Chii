export interface SearchSourceCard {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  sourceDomain: string;
  favicon?: string;
}

export interface SearchQueryResult {
  query: string;
  enabled: boolean;
  provider: string;
  status: "active" | "placeholder_ready" | "disabled";
  sources: SearchSourceCard[];
  summary?: string;
  message: string;
  timestamp: string;
}

export interface LiveWebSearchProvider {
  name: string;
  search(query: string): Promise<SearchQueryResult>;
}

export class RealTimeLiveSearchProvider implements LiveWebSearchProvider {
  name = "realtime_live_search";

  private async fetchGoogleNewsRss(query: string, region = "TZ", lang = "sw"): Promise<SearchSourceCard[]> {
    try {
      const encoded = encodeURIComponent(query.trim());
      const url = `https://news.google.com/rss/search?q=${encoded}&hl=${lang}&gl=${region}&ceid=${region}:${lang}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!res.ok) return [];

      const xml = await res.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      const results: SearchSourceCard[] = [];

      for (let i = 0; i < Math.min(items.length, 6); i++) {
        const item = items[i];
        const rawTitle = item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";
        const rawLink = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
        const rawPubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
        const rawSource = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || "";
        const rawSourceUrl = item.match(/<source[^>]*url="([^"]*)"/)?.[1] || "";

        const cleanTitle = rawTitle
          .replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1")
          .replace(/<[^>]+>/g, "")
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&amp;/g, "&")
          .trim();

        const cleanSource = rawSource
          .replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1")
          .replace(/<[^>]+>/g, "")
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&amp;/g, "&")
          .trim();

        let domain = cleanSource || "news.google.com";
        try {
          if (rawSourceUrl && rawSourceUrl.startsWith("http")) {
            domain = new URL(rawSourceUrl).hostname.replace(/^www\./, "");
          }
        } catch {}

        if (cleanTitle) {
          results.push({
            title: cleanTitle,
            url: rawLink || `https://news.google.com/search?q=${encoded}`,
            snippet: `[Taarifa: ${cleanSource || domain} | Tarehe: ${rawPubDate}] - ${cleanTitle}`,
            publishedDate: rawPubDate,
            sourceDomain: domain,
            favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
          });
        }
      }

      return results;
    } catch {
      return [];
    }
  }

  private async fetchWikipedia(query: string): Promise<SearchSourceCard[]> {
    try {
      const encoded = encodeURIComponent(query.trim());
      const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encoded}&format=json&utf8=1`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!res.ok) return [];
      const json = await res.json();
      const items = json?.query?.search || [];
      const results: SearchSourceCard[] = [];

      for (let i = 0; i < Math.min(items.length, 2); i++) {
        const item = items[i];
        const title = item.title;
        const snippet = item.snippet.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").trim();
        if (title && snippet) {
          results.push({
            title: `${title} - Wikipedia`,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, "_"))}`,
            snippet: `[Taarifa Rasmi Wikipedia: ${title}] - ${snippet}`,
            sourceDomain: "wikipedia.org",
            favicon: "https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32",
          });
        }
      }
      return results;
    } catch {
      return [];
    }
  }

  private async fetchDuckDuckGo(query: string): Promise<SearchSourceCard[]> {
    try {
      const encoded = encodeURIComponent(query.trim());
      const url = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!res.ok) return [];
      const json = await res.json();
      const results: SearchSourceCard[] = [];

      if (json.Heading && json.AbstractText) {
        results.push({
          title: json.Heading,
          url: json.AbstractURL || `https://duckduckgo.com/?q=${encoded}`,
          snippet: `[Taarifa Rasmi: ${json.Heading}] - ${json.AbstractText}`,
          sourceDomain: json.AbstractSource ? `${json.AbstractSource.toLowerCase().replace(/\s+/g, '')}.com` : "duckduckgo.com",
          favicon: "https://www.google.com/s2/favicons?domain=duckduckgo.com&sz=32",
        });
      }

      if (Array.isArray(json.RelatedTopics)) {
        for (const topic of json.RelatedTopics.slice(0, 2)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(" - ")[0] || topic.Text.slice(0, 50),
              url: topic.FirstURL,
              snippet: topic.Text,
              sourceDomain: "duckduckgo.com",
              favicon: "https://www.google.com/s2/favicons?domain=duckduckgo.com&sz=32",
            });
          }
        }
      }

      return results;
    } catch {
      return [];
    }
  }

  async search(query: string): Promise<SearchQueryResult> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return {
        query,
        enabled: true,
        provider: this.name,
        status: "active",
        sources: [],
        message: "Empty query provided.",
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // 1. Fetch Primary Tanzania / Swahili regional news
      const tzPromise = this.fetchGoogleNewsRss(trimmedQuery, "TZ", "sw");
      // 2. Fetch Global / English search for broader verification
      const globalPromise = this.fetchGoogleNewsRss(trimmedQuery, "US", "en");
      // 3. Fetch Wikipedia for background entities
      const wikiPromise = this.fetchWikipedia(trimmedQuery);
      // 4. Fetch DDG instant answers
      const ddgPromise = this.fetchDuckDuckGo(trimmedQuery);

      const [tzSources, globalSources, wikiSources, ddgSources] = await Promise.all([
        tzPromise,
        globalPromise,
        wikiPromise,
        ddgPromise,
      ]);

      const seenUrls = new Set<string>();
      const combined: SearchSourceCard[] = [];

      for (const s of [...tzSources, ...globalSources, ...wikiSources, ...ddgSources]) {
        if (s.url && !seenUrls.has(s.url)) {
          seenUrls.add(s.url);
          combined.push(s);
        }
        if (combined.length >= 10) break;
      }

      return {
        query: trimmedQuery,
        enabled: true,
        provider: this.name,
        status: "active",
        sources: combined,
        summary: combined.length > 0 ? `Zimepatikana taarifa ${combined.length} zilizothibitishwa za hivi karibuni mtandaoni.` : "Hakuna taarifa za moja kwa moja zilizopatikana.",
        message: `Successfully retrieved ${combined.length} live verified sources.`,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn("Live web search error:", err.message || err);
      return {
        query: trimmedQuery,
        enabled: false,
        provider: this.name,
        status: "placeholder_ready",
        sources: [],
        summary: "Live search temporarily unavailable.",
        message: err.message || "Failed to fetch live search results.",
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export function getSearchProvider(): LiveWebSearchProvider {
  return new RealTimeLiveSearchProvider();
}
