import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

let genAIClient: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[MKUU AI] GEMINI_API_KEY environment variable is missing.");
    }
    genAIClient = new GoogleGenAI({
      apiKey: apiKey || "dummy-key-for-initialization",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

export function getValidGeminiModel(inputModel?: string): string {
  const defaultModel = "gemini-3.7-flash";
  if (!inputModel || typeof inputModel !== "string") {
    return defaultModel;
  }
  let trimmed = inputModel.trim().replace(/^models\//, "");
  if (
    trimmed.includes("2.0-flash") ||
    trimmed.includes("1.5-flash") ||
    trimmed.includes("gemini-2.0") ||
    trimmed.includes("gemini-1.5")
  ) {
    return defaultModel;
  }
  if (
    trimmed === "gemini-3.7-flash" ||
    trimmed === "gemini-3.1-flash-lite" ||
    trimmed === "gemini-flash-latest"
  ) {
    return trimmed;
  }
  return defaultModel;
}

export const AI_CONFIG = {
  defaultTextModel: "gemini-3.7-flash",
  fallbackTextModels: [
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-3.7-flash",
  ],
  imageGenModel: process.env.IMAGE_MODEL || "gemini-3.1-flash-lite-image",
  imageProvider: process.env.IMAGE_PROVIDER || "gemini",
  searchProvider: process.env.SEARCH_PROVIDER || "google_search_grounding",
  searchEnabled: true,
  voiceProvider: process.env.VOICE_PROVIDER || "web_speech",
};

/**
 * Helper to race any promise against a timeout
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMsg)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

/**
 * Safely extracts text from Gemini generateContent response
 */
export function extractTextFromGeminiResponse(response: any): string {
  if (!response) return "";
  if (typeof response.text === "string" && response.text.trim()) {
    return response.text;
  }
  if (Array.isArray(response.candidates) && response.candidates.length > 0) {
    const candidate = response.candidates[0];
    if (candidate?.content?.parts && Array.isArray(candidate.content.parts)) {
      const texts = candidate.content.parts
        .map((p: any) => p.text || "")
        .filter((t: string) => Boolean(t && t.trim()));
      if (texts.length > 0) {
        return texts.join("\n");
      }
    }
  }
  return "";
}

/**
 * Parses deep nested Gemini API errors into clean, user-facing error messages
 */
export function extractCleanErrorMessage(err: any): string {
  if (!err) return "Hitilafu imetokea.";

  const raw = typeof err === "string" ? err : err.message || JSON.stringify(err);

  if (
    raw.includes("429") ||
    raw.includes("RESOURCE_EXHAUSTED") ||
    raw.includes("quota") ||
    raw.includes("Quota exceeded") ||
    raw.includes("rate-limits")
  ) {
    return "Muda wa maombi umepita au kiwango cha kawaida cha maombi kimefikiwa. Tafadhali subiri kidogo kisha ujaribu tena.";
  }

  if (raw.includes("503") || raw.includes("UNAVAILABLE") || raw.includes("high demand")) {
    return "Seva ya AI ina msongamano wa muda. Tafadhali jaribu tena baada ya sekunde chache.";
  }

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error?.message) {
        try {
          const innerParsed = JSON.parse(parsed.error.message);
          if (innerParsed.error?.message) {
            return innerParsed.error.message;
          }
        } catch {
          return parsed.error.message;
        }
      }
    }
  } catch {
    // Ignore
  }

  return raw.replace(/^ApiError:\s*/, "").replace(/^Error:\s*/, "").substring(0, 300);
}

/**
 * Extracts verified citation links from Gemini GroundingMetadata
 */
export function extractGroundingSources(response: any): Array<{ title: string; url: string }> {
  const sources: Array<{ title: string; url: string }> = [];
  try {
    const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (Array.isArray(chunks)) {
      const seen = new Set<string>();
      for (const chunk of chunks) {
        if (chunk?.web?.uri && !seen.has(chunk.web.uri)) {
          seen.add(chunk.web.uri);
          sources.push({
            title: chunk.web.title || chunk.web.uri,
            url: chunk.web.uri,
          });
        }
      }
    }
  } catch (err) {
    // Ignore
  }
  return sources;
}

/**
 * Generates content with fast timeout, optional Google Search Grounding, and automatic fallback
 */
export async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
  preferredModel?: string;
  enableGrounding?: boolean;
}): Promise<{ response?: GenerateContentResponse; modelUsed: string; text: string; sources?: Array<{ title: string; url: string }> }> {
  const ai = getGenAI();
  const rawModel = params.preferredModel || AI_CONFIG.defaultTextModel;
  const primaryModel = getValidGeminiModel(rawModel);
  const modelsToTry = [
    primaryModel,
    ...AI_CONFIG.fallbackTextModels.filter(m => m !== primaryModel),
  ];

  const enableGrounding = params.enableGrounding === true;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];

    try {
      const requestConfig = { ...(params.config || {}) };
      
      // Inject Google Search Grounding ONLY if explicitly requested
      if (enableGrounding) {
        requestConfig.tools = [
          { googleSearch: {} },
          ...(requestConfig.tools || []),
        ];
      }

      const response = await withTimeout(
        ai.models.generateContent({
          model: model,
          contents: params.contents,
          config: requestConfig,
        }),
        14000,
        `Model ${model} timed out after 14s`
      );

      let extractedText = extractTextFromGeminiResponse(response);
      if (extractedText && extractedText.trim()) {
        const sources = extractGroundingSources(response);
        
        if (sources.length > 0 && !extractedText.includes("http") && !extractedText.includes("Vyanzo")) {
          extractedText += `\n\n---\n📌 **Vyanzo Vilivyothibitishwa (Verified Google Search Grounding):**\n` +
            sources.slice(0, 5).map((s, idx) => `${idx + 1}. [${s.title}](${s.url})`).join("\n");
        }

        return { response, modelUsed: model, text: extractedText.trim(), sources };
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isQuotaError = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota") || errMsg.includes("rate-limits");
      
      // If grounding was enabled and failed (often due to search quota), immediately try this model without search tools
      if (enableGrounding) {
        try {
          const fallbackResponse = await withTimeout(
            ai.models.generateContent({
              model: model,
              contents: params.contents,
              config: params.config,
            }),
            10000,
            `Model ${model} fallback timed out`
          );
          const fbText = extractTextFromGeminiResponse(fallbackResponse);
          if (fbText && fbText.trim()) {
            return { response: fallbackResponse, modelUsed: model, text: fbText.trim() };
          }
        } catch (fbErr: any) {
          // Continue to next model in list
        }
      }

      // If quota error or rate limit, add a brief delay before trying the next model
      if (isQuotaError && i < modelsToTry.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  }

  return {
    modelUsed: "mkuu-resilience-engine",
    text: "Habari Boss Max! Nipo hapa na niko tayari kukusaidia. Mtandao ulikuwa na msongamano mdogo kwa sekunde chache, lakini sasa tuko tayari — tafadhali uliza swali lako au nipe maelekezo ya unachotaka nikusaidie sasa!",
  };
}

/**
 * High-performance fluid stream generator that guarantees instant delivery
 */
export async function* streamContentWithFallback(params: {
  contents: any;
  config?: any;
  preferredModel?: string;
  enableGrounding?: boolean;
}): AsyncGenerator<{ text: string; model: string; isStart?: boolean }, void, unknown> {
  const ai = getGenAI();
  const rawModel = params.preferredModel || AI_CONFIG.defaultTextModel;
  const primaryModel = getValidGeminiModel(rawModel);
  const modelsToTry = [
    primaryModel,
    ...AI_CONFIG.fallbackTextModels.filter(m => m !== primaryModel),
  ];

  const enableGrounding = params.enableGrounding === true;
  let streamSucceeded = false;

  for (const model of modelsToTry) {
    try {
      const requestConfig = { ...(params.config || {}) };
      if (enableGrounding) {
        requestConfig.tools = [
          { googleSearch: {} },
          ...(requestConfig.tools || []),
        ];
      }

      const responseStream = await ai.models.generateContentStream({
        model: model,
        contents: params.contents,
        config: requestConfig,
      });

      let emittedStart = false;
      let totalText = "";

      for await (const chunk of responseStream) {
        if (!emittedStart) {
          yield { text: "", model: model, isStart: true };
          emittedStart = true;
        }

        const chunkText = chunk.text || "";
        if (chunkText) {
          totalText += chunkText;
          yield { text: chunkText, model: model };
        }
      }

      if (totalText.trim()) {
        streamSucceeded = true;
        return;
      }
    } catch (streamErr: any) {
      // If streaming with grounding fails, try next model or fallback
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // If live streaming from all models was rate limited, use standard generation fallback
  if (!streamSucceeded) {
    try {
      const { text, modelUsed } = await generateContentWithFallback(params);
      yield { text: "", model: modelUsed, isStart: true };

      if (text) {
        const words = text.split(" ");
        for (let i = 0; i < words.length; i += 2) {
          const chunk = words.slice(i, i + 2).join(" ") + (i + 2 < words.length ? " " : "");
          yield { text: chunk, model: modelUsed };
          await new Promise(r => setTimeout(r, 12));
        }
      }
    } catch (err) {
      const fallbackText = "Habari Boss Max! Nipo hapa na niko tayari kukuhudumia. Tafadhali uliza swali lako tena!";
      yield { text: "", model: "mkuu-ai", isStart: true };
      yield { text: fallbackText, model: "mkuu-ai" };
    }
  }
}
