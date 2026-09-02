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

export class ExaWebSearchProvider implements LiveWebSearchProvider {
  name = "exa";

  async search(query: string): Promise<SearchQueryResult> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { query, enabled: true, provider: this.name, status: "active", sources: [], message: "Empty query provided.", timestamp: new Date().toISOString() };
    }

    const key = process.env.EXA_WEB_SEARCH_KEY || process.env.EXA_API_KEY;
    if (!key) {
      return { query: trimmed, enabled: false, provider: this.name, status: "disabled", sources: [], message: "EXA_WEB_SEARCH_KEY haijawekwa kwenye server environment.", timestamp: new Date().toISOString() };
    }

    try {
      const response = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "Accept": "application/json",
        },
        body: JSON.stringify({
          query: trimmed,
          type: "auto",
          numResults: 10,
          contents: { highlights: { maxCharacters: 500 } },
        }),
      });

      const text = await response.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
      if (!response.ok) throw new Error(data?.error || data?.message || `Exa request failed (${response.status})`);

      const sources: SearchSourceCard[] = (data?.results || []).slice(0, 10).map((item: any) => {
        let sourceDomain = "exa.ai";
        try { sourceDomain = new URL(item.url).hostname.replace(/^www\./, ""); } catch {}
        const highlights = Array.isArray(item.highlights) ? item.highlights.join(" ") : "";
        return {
          title: item.title || sourceDomain,
          url: item.url,
          snippet: highlights || item.text?.slice(0, 500) || item.title || "",
          publishedDate: item.publishedDate || item.published_date,
          sourceDomain,
          favicon: `https://www.google.com/s2/favicons?domain=${sourceDomain}&sz=32`,
        };
      }).filter((item: SearchSourceCard) => Boolean(item.url));

      return {
        query: trimmed,
        enabled: true,
        provider: this.name,
        status: "active",
        sources,
        summary: sources.length ? `Zimepatikana taarifa ${sources.length} kutoka Exa.` : "Hakuna matokeo yaliyopatikana.",
        message: `Successfully retrieved ${sources.length} live sources from Exa.`,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn("[MKUU AI] Exa search error:", err?.message || err);
      return {
        query: trimmed,
        enabled: false,
        provider: this.name,
        status: "placeholder_ready",
        sources: [],
        message: err?.message || "Exa search failed.",
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export function getSearchProvider(): LiveWebSearchProvider {
  return new ExaWebSearchProvider();
}
