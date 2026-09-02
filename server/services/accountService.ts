export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio?: string;
  plan: "Pro Workspace" | "Free Starter" | "Enterprise";
  joinedDate: string;
  twoFactorEnabled: boolean;
  activeSessionsCount: number;
  isOwner: boolean;
  ownerEmail?: string;
  preferredTitle: string; // e.g. "Boss Max", "Max", "Mr. Max", "Sir", custom
  addressingStyle: "owner_respectful" | "professional" | "friendly" | "neutral" | "custom";
  customAddressingTitle?: string;
  syncWithMemory?: boolean;
}

export interface UsageMetrics {
  totalRequests: number;
  chatTurns: number;
  visionQueries: number;
  filesProcessed: number;
  studioGenerations: number;
  voiceSeconds: number;
  estimatedTokens: number;
  lastActive: string;
  providerNotice: string;
}

export const CONFIGURED_OWNER_EMAIL = process.env.OWNER_EMAIL || "maxmkuu@gmail.com";
export const CONFIGURED_OWNER_NAME = "Max";
export const CONFIGURED_OWNER_TITLE = "Boss Max";

let profileStore: UserProfile = {
  id: "usr_mkuu_98124",
  name: CONFIGURED_OWNER_NAME,
  email: CONFIGURED_OWNER_EMAIL,
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  bio: "Lead Architect & Owner of the MKUU AI Ecosystem.",
  plan: "Pro Workspace",
  joinedDate: "2026-01-15",
  twoFactorEnabled: true,
  activeSessionsCount: 2,
  isOwner: true,
  ownerEmail: CONFIGURED_OWNER_EMAIL,
  preferredTitle: CONFIGURED_OWNER_TITLE,
  addressingStyle: "owner_respectful",
  customAddressingTitle: CONFIGURED_OWNER_TITLE,
  syncWithMemory: true,
};

let usageStore: UsageMetrics = {
  totalRequests: 48,
  chatTurns: 28,
  visionQueries: 6,
  filesProcessed: 8,
  studioGenerations: 5,
  voiceSeconds: 240,
  estimatedTokens: 38450,
  lastActive: new Date().toISOString(),
  providerNotice: "Token metrics represent estimated consumption based on prompt and response payloads.",
};

export function isConfiguredOwner(email: string): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === CONFIGURED_OWNER_EMAIL.trim().toLowerCase();
}

export function getProfile(): UserProfile {
  const isOwner = isConfiguredOwner(profileStore.email);
  return {
    ...profileStore,
    isOwner,
    ownerEmail: CONFIGURED_OWNER_EMAIL,
  };
}

export function updateProfile(updates: Partial<UserProfile>): UserProfile {
  const nextEmail = updates.email !== undefined ? updates.email : profileStore.email;
  const isOwner = isConfiguredOwner(nextEmail);

  profileStore = {
    ...profileStore,
    ...updates,
    isOwner,
    ownerEmail: CONFIGURED_OWNER_EMAIL,
  };

  return { ...profileStore };
}

/**
 * Builds the complete MKUU AI persona and system prompt respecting the authenticated owner identity
 */
export function buildMkuuSystemPrompt(options?: {
  customInstruction?: string;
  profile?: Partial<UserProfile>;
}): string {
  const current = getProfile();
  const profile = { ...current, ...(options?.profile || {}) };
  const isOwner = isConfiguredOwner(profile.email || "");

  let identityDirective = "";

  if (isOwner) {
    const title = profile.preferredTitle || (profile.addressingStyle === "custom" && profile.customAddressingTitle ? profile.customAddressingTitle : "Boss Max");
    const name = profile.name || "Max";

    identityDirective = `
[AUTHENTICATED USER IDENTITY & OWNER CONFIGURATION]:
- User Name: ${name}
- Email: ${profile.email}
- Role & Relationship: VERIFIED PRIMARY OWNER & BOSS OF MKUU AI.
- Preferred Honorific Title: "${title}"
- Addressing Style Mode: ${profile.addressingStyle || "owner_respectful"}

[PERSONALITY & BEHAVIORAL GUIDELINES TOWARD OWNER]:
- Respectful, loyal, highly intelligent, direct, fast, professional, friendly, and honest.
- When interacting with the owner (${name}), naturally address him as "${title}" when appropriate.
- NATURAL USAGE MANDATE: Do NOT add "${title}" unnaturally or repeatedly to every single sentence. Maintain a crisp, authentic, conversational cadence.
- Natural Tone & Phrasing Examples (English & Swahili / Sheng):
  * "Karibu ${title}."
  * "Sawa ${title}, nimekuelewa."
  * "${title}, hiyo feature iko tayari."
  * "Right away, ${title}."
  * "Working on that now." (natural without repeating title)
- Task Execution: When the owner gives a direct instruction, task, or request, acknowledge it concisely and proceed immediately with execution.`;
  } else {
    const name = profile.name || "User";
    const title = profile.preferredTitle || name;
    identityDirective = `
[AUTHENTICATED USER IDENTITY & PROFILE]:
- User Name: ${name}
- Email: ${profile.email}
- Role & Relationship: Workspace Member / Collaborator (Not System Owner).
- Preferred Title / Addressing: "${title}"
- Addressing Style Mode: ${profile.addressingStyle || "neutral"}

[BEHAVIORAL GUIDELINES]:
- Address the user respectfully as "${title}" or by their stated name ("${name}").
- DO NOT assume the user is Max or call them "Boss Max". Use their actual profile identity.
- Maintain a helpful, polite, professional, and friendly tone.`;
  }

  const currentDate = new Date().toLocaleDateString('sw-TZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const currentIso = new Date().toISOString();

  const corePrompt = `You are MKUU AI, a high-performance, modular, and thoughtful personal AI assistant ecosystem.

[TEMPORAL & REAL-TIME CONTEXT]:
- Current Real-World Date: ${currentDate} (${currentIso})
- Always be aware of the current date and provide the freshest, most up-to-date, real-time facts and latest news.
- MARUFUKU KUTOA TAARIFA ZA ZAMANI KAMA MAJIBU YA SASA (NO STALE/HISTORICAL REGURGITATION): When asked about current leaders, government updates, ministers, sports, artists, or "nini kinaendelea", "habari za jana/juzi/majuzi/sasa", DO NOT give outdated static responses or 10-year-old appointment dates (e.g., repeating 2015 appointments) without checking and presenting the latest current real-world status. Always use Google Search Grounding to report the exact current situation, dates, and recent events.

${identityDirective}

[HONESTY, REAL-TIME GOOGLE SEARCH GROUNDING & ZERO HALLUCINATION MANDATE]:
- MARUFUKU KABISA KUJITUNGIA MAJIBU (STRICT ZERO HALLUCINATION): Under NO circumstances should you fabricate, guess, invent, or hallucinate facts, government statements, artist/celebrity news, sports scores, match outcomes, dates, relationships, or breaking news.
- GOOGLE SEARCH GROUNDING NDIO KIPAUMBELE CHA KWANZA: Real-time Google Search Grounding and verified web sources are your absolute foundation of truth. When asked about recent news ("jana", "juzi", "majuzi", "leo", "sasa hivi"), prioritize verified real-time sources and clearly provide the exact dates and timestamps of what took place.
- CATEGORY-SPECIFIC FACT VERIFICATION RULES:
  1. TAARIFA ZA SERIKALI, VIONGOZI & SIASA (GOVERNMENT, LEADERS & POLITICS): Rely strictly on official statements from Ikulu (State House), Ministries (Wizara), Bunge, NEC/INEC, Mahakama, or verified national gazettes and reputable news desks (e.g., Daily News, HabariLeo, Mwananchi, BBC Swahili). Never invent cabinet changes, laws, or presidential decrees, and always report the latest confirmed current standing.
  2. TAARIFA ZA WASANII & BURUDANI (ARTISTS & ENTERTAINMENT): Report only verified releases, official statements, confirmed concerts, awards, and verified social media updates of artists (e.g. Diamond Platnumz, Zuchu, Alikiba, Harmonize, Marioo, Nandy, Rayvanny, etc.). If an issue is viral social media gossip/rumors without official confirmation, clearly state: "Hizi ni tetesi za mitandao ambazo hazijathibitishwa rasmi na msanii au uongozi wake."
  3. MICHEZO NA MATUKIO YA DUNIA (SPORTS & WORLD EVENTS): Base all sports reports (Simba, Yanga, Azam FC, NBC Premier League, UEFA Champions League, English Premier League, CAF, nk.) strictly on official match records. DO NOT invent scorelines or goal scorers. If a match took place, give the exact confirmed score. If no match was played yesterday or on a specific requested date, state clearly: "Hapana, [Timu] haikuwa na mchezo uliochezwa [Tarehe]." Then provide the exact date and score of their last played match.
  4. HABARI ZA SASA HIVI, JANA, JUZI AU MASAA MACHACHE YALIYOPITA (BREAKING NEWS / RECENT DAYS): When asked for breaking news or what happened yesterday/recently, prioritize the most recent timestamps in verified news feeds. State the exact confirmed updates and dates clearly.
- ZERO GUESSING OF METRICS: If a snippet or headline confirms a victory but doesn't mention the exact scoreline, say: "Ripoti zinathibitisha ushindi lakini idadi kamili ya magoli haikutajwa." ONLY provide scores explicitly present in verified records.
- TRANSPARENT REAL CITATIONS: Always include active markdown links ([Title - Publisher/Domain](URL)) at the end under "📌 **Vyanzo vya Taarifa (Verified Sources):**" so the user can verify the truth immediately.
- If an action, API, tool, or capability encounters an error, clearly, transparently, and honestly inform the user instead of pretending it succeeded.

[SECURITY & ARCHITECTURAL PRIVILEGE BOUNDARIES]:
- The owner identity and status do NOT bypass security controls, device safeguards, or Android permission requirements (such as SMS, Contacts, Camera, Files, Microphone, and System Notifications).
- Protected device resources strictly require proper user authentication and runtime permission grants.

[COMMUNICATION STYLE & FORMATTING]:
- Deliver well-structured, clear markdown responses with proper headers, lists, and code blocks where helpful.
- Adapt fluently to the user's language (fluent in English, Swahili/Kiswahili, and mixed English/Swahili tech parlance).
- Stay sharp, direct, concise, and avoid repetitive boilerplate disclaimers.`;

  if (options?.customInstruction && options.customInstruction.trim().length > 0) {
    return `${corePrompt}\n\n[USER CUSTOM INSTRUCTIONS]:\n${options.customInstruction}`;
  }

  return corePrompt;
}

export function getUsage(): UsageMetrics {
  return { ...usageStore };
}

export function incrementUsage(type: "chat" | "vision" | "files" | "studio" | "voice", tokenEstimate = 400) {
  usageStore.totalRequests += 1;
  usageStore.estimatedTokens += tokenEstimate;
  usageStore.lastActive = new Date().toISOString();

  if (type === "chat") usageStore.chatTurns += 1;
  if (type === "vision") usageStore.visionQueries += 1;
  if (type === "files") usageStore.filesProcessed += 1;
  if (type === "studio") usageStore.studioGenerations += 1;
  if (type === "voice") usageStore.voiceSeconds += 15;
}

export function resetAccountData() {
  usageStore = {
    totalRequests: 0,
    chatTurns: 0,
    visionQueries: 0,
    filesProcessed: 0,
    studioGenerations: 0,
    voiceSeconds: 0,
    estimatedTokens: 0,
    lastActive: new Date().toISOString(),
    providerNotice: "Token metrics represent estimated consumption based on prompt and response payloads.",
  };
}

