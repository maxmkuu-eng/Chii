import { generateContentWithFallback, AI_CONFIG } from "./ai.js";

export interface MemoryItem {
  id: string;
  title: string;
  content: string;
  category: "preference" | "fact" | "work" | "personal" | "instruction";
  reason: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

// In-memory persistent mock storage for session continuity, synced with client storage
let memoriesStore: MemoryItem[] = [
  {
    id: "mem-owner-identity",
    title: "Owner Identity & Preferred Title",
    content: "User Max (maxmkuu@gmail.com) is the verified Owner/Boss of MKUU AI. Preferred honorific: 'Boss Max'. Natural addressing in English/Swahili (e.g. 'Karibu Boss Max', 'Sawa Boss Max, nimekuelewa') without repetitive over-usage. Loyal, respectful, and direct partnership.",
    category: "instruction",
    reason: "Primary Owner Identity & Persona Configuration",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    active: true,
  },
  {
    id: "mem-1",
    title: "Preferred Coding Language",
    content: "Prefers TypeScript, React with Tailwind CSS, and clean modular architecture.",
    category: "preference",
    reason: "Deduced from user instructions regarding code structure & development standards.",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    active: true,
  },
  {
    id: "mem-2",
    title: "Communication Style",
    content: "Appreciates concise, objective explanations with clear headings, bullet points, and runnable code examples.",
    category: "preference",
    reason: "Saved to tailor assistant responses directly to user's workflow.",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    active: true,
  },
  {
    id: "mem-3",
    title: "Project Scope Policy",
    content: "Always keep tools modular and independent. Never crowd multiple unrelated capabilities onto one page.",
    category: "instruction",
    reason: "Explicit user guideline from MKUU AI master architecture guidelines.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    active: true,
  }
];

export function getMemories(): MemoryItem[] {
  return [...memoriesStore];
}

export function addMemory(item: Omit<MemoryItem, "id" | "createdAt" | "updatedAt">): MemoryItem {
  const newMemory: MemoryItem = {
    id: "mem-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
    ...item,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  memoriesStore.unshift(newMemory);
  return newMemory;
}

export function updateMemory(id: string, updates: Partial<MemoryItem>): MemoryItem | null {
  const index = memoriesStore.findIndex(m => m.id === id);
  if (index === -1) return null;
  memoriesStore[index] = {
    ...memoriesStore[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return memoriesStore[index];
}

export function deleteMemory(id: string): boolean {
  const initialLength = memoriesStore.length;
  memoriesStore = memoriesStore.filter(m => m.id !== id);
  return memoriesStore.length < initialLength;
}

export function clearAllMemories(): boolean {
  memoriesStore = [];
  return true;
}

export function syncProfileIdentityToMemory(profile: {
  name: string;
  email: string;
  isOwner: boolean;
  preferredTitle: string;
  addressingStyle: string;
}) {
  const existingIdx = memoriesStore.findIndex(
    m => m.id === "mem-owner-identity" || m.title === "Owner Identity & Preferred Title" || m.title === "User Identity & Preferred Title"
  );
  
  const title = profile.isOwner ? "Owner Identity & Preferred Title" : "User Identity & Preferred Title";
  const content = profile.isOwner
    ? `User ${profile.name} (${profile.email}) is the verified Owner/Boss of MKUU AI. Preferred honorific: '${profile.preferredTitle}'. Natural addressing in English/Swahili (e.g. 'Karibu ${profile.preferredTitle}', 'Sawa ${profile.preferredTitle}, nimekuelewa') without repetitive over-usage. Loyal, respectful, and direct partnership.`
    : `User ${profile.name} (${profile.email}) is a workspace member. Preferred title: '${profile.preferredTitle}'. Addressing style: ${profile.addressingStyle}. Address respectfully by their stated identity.`;

  if (existingIdx >= 0) {
    memoriesStore[existingIdx] = {
      ...memoriesStore[existingIdx],
      title,
      content,
      updatedAt: new Date().toISOString(),
      active: true,
    };
  } else {
    memoriesStore.unshift({
      id: "mem-owner-identity",
      title,
      content,
      category: "instruction",
      reason: "Synchronized from User Profile & Identity Settings",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: true,
    });
  }
}


export async function extractMemoriesFromText(text: string) {
  try {
    const prompt = `Analyze the following user input or conversation and identify if there are any valuable long-term facts, preferences, user constraints, or personal details worth remembering for future AI interactions.
If found, output a JSON array of objects with keys: "title", "content", "category" (must be one of: "preference", "fact", "work", "personal", "instruction"), and "reason" (explanation of why this should be remembered).
If nothing noteworthy to remember, return an empty JSON array [].

Text to analyze:
"${text}"

Respond with ONLY valid JSON.`;

    const { response } = await generateContentWithFallback({
      preferredModel: AI_CONFIG.defaultTextModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Memory extraction notice:", err);
    return [];
  }
}
