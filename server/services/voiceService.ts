import { generateContentWithFallback, AI_CONFIG } from "./ai.js";
import { getProfile, isConfiguredOwner } from "./accountService.js";

export interface VoiceTurnRequest {
  transcript: string;
  voicePersona?: string;
  conversationHistory?: Array<{ role: "user" | "model"; text: string }>;
  generateSpeechAudio?: boolean;
}

export interface VoiceTurnResponse {
  replyText: string;
  audioBase64?: string;
  provider: string;
  durationEstimateMs: number;
}

export async function processVoiceTurn(req: VoiceTurnRequest): Promise<VoiceTurnResponse> {
  const profile = getProfile();
  const isOwner = isConfiguredOwner(profile.email || "");
  const title = profile.preferredTitle || (isOwner ? "Boss Max" : profile.name || "User");

  const identityInstruction = isOwner
    ? `The user is ${profile.name} (${profile.email}), recognized as the verified Owner/Boss of MKUU AI. Naturally address him as '${title}' when appropriate (e.g. 'Sawa ${title}', 'Nimekuelewa ${title}') without forcing it on every single sentence. Maintain a loyal, respectful, direct, and fast verbal interaction.`
    : `The user is ${profile.name} (${profile.email}). Address them respectfully as '${title}'. Do not call them Boss Max unless configured.`;

  const historyPrompt = req.conversationHistory && req.conversationHistory.length > 0
    ? req.conversationHistory.map(h => `${h.role === "user" ? "User" : "MKUU AI"}: ${h.text}`).join("\n") + "\n"
    : "";

  const fullPrompt = `${historyPrompt}User: ${req.transcript}\nMKUU AI:`;

  const { text, response } = await generateContentWithFallback({
    preferredModel: AI_CONFIG.defaultTextModel,
    contents: fullPrompt,
    config: {
      systemInstruction: `You are MKUU AI Voice, an articulate, spoken conversational AI assistant companion.
${identityInstruction}
Keep answers spoken-friendly: concise, conversational, engaging, avoiding dense markdown, bullet lists, code fences, or unpronounceable formatting. Answer naturally in 1 to 3 spoken sentences.`,
      temperature: 0.7,
    },
  });

  const replyText = text || (response ? response.text : "") || "Nimekuelewa Boss Max. Nini kingine nikusaidie?";

  return {
    replyText,
    provider: AI_CONFIG.voiceProvider,
    durationEstimateMs: Math.max(1500, replyText.split(" ").length * 280),
  };
}
