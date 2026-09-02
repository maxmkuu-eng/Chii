import { generateContentWithFallback, streamContentWithFallback, extractCleanErrorMessage, AI_CONFIG } from "./ai.js";
import { buildMkuuSystemPrompt, getProfile, UserProfile } from "./accountService.js";
import { getSearchProvider, SearchQueryResult } from "./searchService.js";

export interface ChatMessage {
  role: "user" | "model" | "system";
  content: string;
  attachments?: Array<{
    id?: string;
    name?: string;
    mimeType?: string;
    type?: string;
    size?: number;
    data?: string; // base64
  }>;
}

export interface GenerateChatRequest {
  messages: ChatMessage[];
  systemInstruction?: string;
  userProfile?: Partial<UserProfile>;
  temperature?: number;
  activeMemories?: string[];
  stream?: boolean;
}

function shouldSearchWeb(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const lower = text.toLowerCase().trim();
  
  // If it's a pure programming request or simple greeting, don't need web search
  if (/^(hi|hello|mambo|habari|vipi|test|ping)$/i.test(lower)) return false;
  if (/^(andika|code|program|function|html|css|javascript|typescript|python|react)\b/i.test(lower) && !lower.includes("latest") && !lower.includes("sasa") && !lower.includes("habari")) return false;

  const searchTriggers = [
    "leo", "sasa", "hivi karibuni", "habari", "taarifa", "latest", "recent",
    "news", "matukio", "zuchu", "diamond", "simba", "yanga", "nani", "lini",
    "matokeo", "bei", "leo hii", "jana", "juzi", "majuzi", "mwezi huu", "mwaka huu", "2026", "2025",
    "nini kinaendelea", "kuna habari gani", "updates", "current", "today", "who is",
    "what happened", "kujifungua", "mtoto", "mimba", "harusi", "kifo", "kufariki",
    "kujiuzulu", "rais", "waziri", "waziri mkuu", "kassim majaliwa", "majaliwa", "samia", "magufuli",
    "uchaguzi", "ngoma mpya", "albamu", "tuzo", "baraza la mawaziri", "mawaziri",
    "score", "match", "live", "tanzania", "bongo", "serikali", "ikulu", "bunge", "spika",
    "wasanii", "msanii", "alikiba", "harmonize", "marioo", "nandy", "rayvanny",
    "michezo", "dunia", "masaa", "masaa mawili", "masaa 2", "masaa machache",
    "breaking", "dharura", "mitandao", "tetesi", "social media", "instagram", "x", "twitter",
    "epl", "champions league", "caf", "nbc", "azam", "tff", "kocha", "usajili", "magoli"
  ];
  
  return searchTriggers.some(trigger => lower.includes(trigger)) || lower.includes("?") || lower.length > 20;
}

function extractSearchQueries(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const queries: string[] = [];

  const knownEntities: Record<string, string> = {
    "waziri mkuu": "Waziri Mkuu wa Tanzania habari za sasa",
    "kassim majaliwa": "Kassim Majaliwa Waziri Mkuu Tanzania habari za hivi karibuni",
    "majaliwa": "Kassim Majaliwa habari za hivi karibuni",
    "baraza la mawaziri": "Baraza la Mawaziri Tanzania taarifa rasmi Ikulu",
    "yanga": "Yanga SC habari matokeo",
    "simba": "Simba SC habari matokeo",
    "zuchu": "Zuchu habari matukio",
    "diamond": "Diamond Platnumz habari matukio",
    "harmonize": "Harmonize Konde Music habari",
    "alikiba": "Alikiba Kings Music habari",
    "marioo": "Marioo habari",
    "nbc premier league": "NBC Premier League Tanzania matokeo",
    "ligi kuu": "Ligi Kuu Tanzania Bara NBC",
    "samia": "Rais Samia Suluhu Hassan Ikulu habari za hivi karibuni",
    "ikulu": "Ikulu Tanzania taarifa rasmi za hivi karibuni",
    "serikali": "Serikali ya Tanzania taarifa rasmi za hivi karibuni",
    "tundu lissu": "Tundu Lissu CHADEMA habari",
    "azam fc": "Azam FC matokeo habari",
    "masaa mawili": "Tanzania habari za sasa hivi breaking news",
    "masaa 2": "Tanzania habari za sasa hivi breaking news",
    "jana": "Tanzania habari za jana na leo breaking news",
    "juzi": "Tanzania habari za hivi karibuni matukio",
    "majuzi": "Tanzania habari za hivi karibuni matukio",
    "wasanii": "Wasanii wa Tanzania Bongo Flava habari za sasa",
  };

  for (const [key, val] of Object.entries(knownEntities)) {
    if (lower.includes(key)) {
      queries.push(val);
    }
  }

  // Clean the sentence to get search query
  const clean = text
    .replace(/[?,.!]/g, "")
    .replace(/\b(kuna|habari|gani|za|leo|hivi|karibuni|jana|juzi|majuzi|nipe|matokeo|na|vyanzo|vyako|taarifa|walicheza|kuhusu|je|sasa|bongo|mitandao|masaa|mawili|yaliyopita)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (clean && clean.length > 2 && !queries.includes(clean)) {
    queries.push(clean);
  }

  if (queries.length === 0) {
    queries.push(text.trim());
  }

  return Array.from(new Set(queries)).slice(0, 3);
}

async function fetchLiveSearchContext(userMessage: string): Promise<string> {
  try {
    const searchQueries = extractSearchQueries(userMessage);
    const provider = getSearchProvider();

    const searchPromises = searchQueries.map(q => provider.search(q));
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));

    const raceResults = await Promise.race([
      Promise.all(searchPromises),
      timeoutPromise,
    ]);

    if (!raceResults) {
      return "";
    }

    const seenUrls = new Set<string>();
    const allSources: any[] = [];

    for (const res of raceResults) {
      if (res && res.sources) {
        for (const s of res.sources) {
          if (s.url && !seenUrls.has(s.url)) {
            seenUrls.add(s.url);
            allSources.push(s);
          }
        }
      }
    }

    if (allSources.length === 0) {
      return "";
    }

    const formattedSources = allSources
      .slice(0, 7)
      .map((s, idx) => `[${idx + 1}] Title: ${s.title}\n    Published Date: ${s.publishedDate || "Hivi karibuni"}\n    Publisher/Domain: ${s.sourceDomain}\n    Real URL: ${s.url}\n    Snippet: ${s.snippet}`)
      .join("\n\n");

    return `\n\n[VERIFIED REAL-TIME LIVE SEARCH RESULTS - ${new Date().toISOString()}]:
${formattedSources}

[STRICT FACTUAL GROUNDING & CITATION RULES]:
1. TRUTHFULNESS & ZERO HALLUCINATION (MARUFUKU KABISA KUJITUNGIA): You MUST base your factual answers, dates, match scores, artist updates, government declarations, and news statements strictly on the verified search results listed above.
2. ZERO GUESSING OF SCORES & METRICS: DO NOT FABRICATE or invent any match scores (e.g., claiming "3 - 0" or "2 - 1"), goals, song titles, or metrics not explicitly written in the snippets above. If a source reports "Yanga yashinda mechi" but does NOT specify the numerical score, state honestly: "Ripoti zinathibitisha ushindi wa Yanga, lakini idadi kamili ya magoli haikutajwa kwenye muktadha huu." Only state numerical scores if they are explicitly in the text (e.g. "3–1").
3. CAREFULLY DISTINGUISH ARTICLE PUBLICATION DATES FROM MATCH/EVENT DATES: An article or headline published yesterday or today may be discussing an earlier match or upcoming fixtures. Do NOT assume a game was played yesterday simply because an article was published yesterday. Check the context carefully.
4. IF ASKED ABOUT YESTERDAY OR THE LAST 2 HOURS: If no official match or event took place yesterday, clearly state: "Hapana, [Timu/Mtu] hakukuwa na mechi au tukio lililofanyika jana [Tarehe]". Then state their actual latest confirmed activity and date from the records.
5. MANDATORY REAL SOURCES SECTION: At the end of your response, list the actual verified sources provided above with markdown links in this exact format:
---
📌 **Vyanzo vya Taarifa (Verified Sources):**
1. [Title - Publisher](URL) - Published Date`;
  } catch (err: any) {
    console.warn("Could not fetch live search context:", err.message || err);
    return "";
  }
}

function buildContents(messages: ChatMessage[]) {
  return messages
    .filter(msg => Boolean((msg.content && msg.content.trim()) || (msg.attachments && msg.attachments.length > 0)))
    .map(msg => {
      const parts: any[] = [];

      if (msg.attachments && msg.attachments.length > 0) {
        for (const att of msg.attachments) {
          const mime = (att.mimeType || att.type || "").toLowerCase();
          const name = att.name || "File";
          if (att.data && mime.startsWith("image/")) {
            const base64Data = att.data.includes("base64,") ? att.data.split("base64,")[1] : att.data;
            parts.push({
              inlineData: {
                mimeType: mime || "image/jpeg",
                data: base64Data,
              },
            });
          } else if (att.data) {
            parts.push({
              text: `[Attached File: ${name}]\n${att.data}`,
            });
          }
        }
      }

      if (msg.content && msg.content.trim()) {
        parts.push({ text: msg.content.trim() });
      } else if (parts.length === 0) {
        parts.push({ text: "Hello" });
      }

      return {
        role: msg.role === "user" ? "user" : "model",
        parts: parts,
      };
    });
}

export async function generateChatResponse(req: GenerateChatRequest) {
  let effectiveSystemInstruction = buildMkuuSystemPrompt({
    customInstruction: req.systemInstruction,
    profile: req.userProfile || getProfile(),
  });

  if (req.activeMemories && req.activeMemories.length > 0) {
    effectiveSystemInstruction += `\n\n[USER RELEVANT SAVED MEMORIES & PREFERENCES]:\n` + 
      req.activeMemories.map(m => `- ${m}`).join("\n") +
      `\nUtilize these user memories naturally to provide personalized, relevant responses without explicitly saying 'according to my memory'.`;
  }

  // Check if real-time web search grounding is helpful
  const latestUserMsg = [...req.messages].reverse().find(m => m.role === "user")?.content || "";
  const isWebSearchNeeded = shouldSearchWeb(latestUserMsg);
  
  if (isWebSearchNeeded) {
    const liveSearchContext = await fetchLiveSearchContext(latestUserMsg);
    if (liveSearchContext) {
      effectiveSystemInstruction += liveSearchContext;
    }
  }

  const contents = buildContents(req.messages);

  const { text, modelUsed } = await generateContentWithFallback({
    preferredModel: AI_CONFIG.defaultTextModel,
    contents: contents,
    config: {
      systemInstruction: effectiveSystemInstruction,
      temperature: req.temperature ?? 0.3, // Lower temperature to prevent hallucinations
    },
    enableGrounding: isWebSearchNeeded,
  });

  return {
    text: text.trim(),
    model: modelUsed,
  };
}

export async function* generateChatStream(req: GenerateChatRequest) {
  let effectiveSystemInstruction = buildMkuuSystemPrompt({
    customInstruction: req.systemInstruction,
    profile: req.userProfile || getProfile(),
  });

  if (req.activeMemories && req.activeMemories.length > 0) {
    effectiveSystemInstruction += `\n\n[USER RELEVANT SAVED MEMORIES & PREFERENCES]:\n` + 
      req.activeMemories.map(m => `- ${m}`).join("\n") +
      `\nUtilize these user memories naturally to provide personalized, relevant responses.`;
  }

  // Check if real-time web search grounding is helpful in streaming as well
  const latestUserMsg = [...req.messages].reverse().find(m => m.role === "user")?.content || "";
  const isWebSearchNeeded = shouldSearchWeb(latestUserMsg);

  if (isWebSearchNeeded) {
    const liveSearchContext = await fetchLiveSearchContext(latestUserMsg);
    if (liveSearchContext) {
      effectiveSystemInstruction += liveSearchContext;
    }
  }

  const contents = buildContents(req.messages);

  for await (const chunk of streamContentWithFallback({
    preferredModel: AI_CONFIG.defaultTextModel,
    contents: contents,
    config: {
      systemInstruction: effectiveSystemInstruction,
      temperature: req.temperature ?? 0.3,
    },
    enableGrounding: isWebSearchNeeded,
  })) {
    yield chunk;
  }
}

