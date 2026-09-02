export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | string;
  style?: string;
  mode?: "generate" | "edit" | "variation" | "remove_bg" | "upscale" | "mannequin" | string;
  sourceImage?: string;
}

export interface GeneratedImageResult {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  style: string;
  mode: string;
  createdAt: string;
  provider: string;
  model: string;
  metadata?: Record<string, any>;
}

const BASE_URL = (process.env.MAGIC_HOUR_API_URL || "https://api.magichour.ai/v1").replace(/\/$/, "");
const API_KEY = process.env.MAGIC_HOUR_API_KEY;
const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;
let studioGallery: GeneratedImageResult[] = [];

export function getGalleryImages() { return [...studioGallery]; }
export function saveToGallery(image: GeneratedImageResult) { studioGallery.unshift(image); return image; }
export function deleteGalleryImage(id: string) {
  const before = studioGallery.length;
  studioGallery = studioGallery.filter((image) => image.id !== id);
  return studioGallery.length < before;
}

function requireKey() {
  if (!API_KEY) throw new Error("MAGIC_HOUR_API_KEY haijawekwa kwenye server environment.");
}

async function mh(path: string, init: RequestInit = {}) {
  requireKey();
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!response.ok) {
    if (response.status === 402) throw new Error("Magic Hour haina credits za kutosha kwa picha hii.");
    throw new Error(`Magic Hour (${response.status}): ${data?.error?.message || data?.message || text}`);
  }
  return data;
}

async function waitForCompletion(id: string) {
  const deadline = Date.now() + 120000;
  let delay = 1200;
  while (Date.now() < deadline) {
    const project = await mh(`/image-projects/${encodeURIComponent(id)}`);
    if (project.status === "complete") return project;
    if (project.status === "error" || project.status === "canceled") {
      throw new Error(project?.error?.message || "Magic Hour image job failed.");
    }
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(Math.round(delay * 1.25), 4000);
  }
  throw new Error("Magic Hour image generation imechukua muda mrefu sana.");
}

function outputUrl(project: any) {
  const url = project?.downloads?.[0]?.url || project?.download?.url;
  if (!url) throw new Error("Magic Hour haikurudisha URL ya picha iliyotengenezwa.");
  return url;
}

function parseBase64(source: string) {
  const m = source.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/s);
  if (!m) throw new Error("sourceImage lazima iwe data:image/...;base64,...");
  const extension = m[1].toLowerCase() === "jpeg" ? "jpg" : m[1].toLowerCase();
  return { extension, mimeType: `image/${extension === "jpg" ? "jpeg" : extension}`, bytes: new Uint8Array(Buffer.from(m[2], "base64")) };
}

async function uploadImage(source: string) {
  const { extension, mimeType, bytes } = parseBase64(source);
  const upload = await mh("/files/upload-urls", {
    method: "POST",
    body: JSON.stringify({ items: [{ extension, type: "image" }] }),
  });
  const item = upload?.items?.[0];
  if (!item?.upload_url || !item?.file_path) throw new Error("Magic Hour haikutoa upload URL ya picha.");
  const put = await fetch(item.upload_url, {
    method: "PUT",
    body: bytes as any,
    headers: { "Content-Type": mimeType },
  });
  if (!put.ok) throw new Error(`Magic Hour image upload failed (${put.status}).`);
  return item.file_path;
}

/**
 * Credit-safe fallback for background removal.
 * If Magic Hour returns a credit/quota error and REMOVE_BG_API_KEY is configured,
 * the original image is sent to remove.bg and the resulting PNG is returned as
 * a data URL, so the UI still receives a real image instead of a text answer.
 */
async function removeBackgroundFallback(source: string): Promise<GeneratedImageResult> {
  if (!REMOVE_BG_API_KEY) {
    throw new Error("Magic Hour haina credits za kutosha. Weka REMOVE_BG_API_KEY ili Remove background itumie fallback bila kutumia Magic Hour credits.");
  }

  const { mimeType, bytes } = parseBase64(source);
  const form = new FormData();
  form.append("image_file", new Blob([bytes], { type: mimeType }), `mkuu-input.${mimeType === "image/jpeg" ? "jpg" : "png"}`);
  form.append("size", "auto");

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": REMOVE_BG_API_KEY },
    body: form,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Remove.bg fallback failed (${response.status}): ${errorText.substring(0, 240)}`);
  }

  const output = Buffer.from(await response.arrayBuffer()).toString("base64");
  return saveToGallery({
    id: `img-removebg-${Date.now()}`,
    url: `data:image/png;base64,${output}`,
    prompt: "Remove background",
    aspectRatio: "auto",
    style: "background-removal",
    mode: "remove_bg",
    createdAt: new Date().toISOString(),
    provider: "remove_bg_fallback",
    model: "remove.bg",
    metadata: { fallback: true },
  });
}

function makeResult(project: any, options: ImageGenerationOptions, model: string): GeneratedImageResult {
  return saveToGallery({
    id: `img-${project.id}`,
    url: outputUrl(project),
    prompt: options.prompt || `Image ${options.mode || "generate"}`,
    aspectRatio: options.aspectRatio || "auto",
    style: options.style || "general",
    mode: options.mode || "generate",
    createdAt: new Date().toISOString(),
    provider: "magic_hour",
    model,
    metadata: { magicHourProjectId: project.id, creditsCharged: project.credits_charged },
  });
}

export async function generateImage(options: ImageGenerationOptions) {
  const created = await mh("/ai-image-generator", {
    method: "POST",
    body: JSON.stringify({
      name: `MKUU Studio ${new Date().toISOString()}`,
      image_count: 1,
      model: "default",
      aspect_ratio: options.aspectRatio || "1:1",
      resolution: "auto",
      style: {
        prompt: [options.prompt, options.style ? `Style: ${options.style}` : "", options.negativePrompt ? `Avoid: ${options.negativePrompt}` : ""].filter(Boolean).join("\n"),
        tool: "general",
      },
    }),
  });
  const project = await waitForCompletion(created.id);
  return makeResult(project, options, project?.model || "default");
}

export async function editImage(options: ImageGenerationOptions) {
  if (!options.sourceImage) throw new Error("sourceImage inahitajika kwa Image Studio edit.");

  // Background removal is the one edit that can safely fail over to another
  // provider because it does not require generative prompting.
  if (options.mode === "remove_bg") {
    try {
      const filePath = await uploadImage(options.sourceImage);
      const prompt = `Remove the background and keep the main subject cleanly isolated. ${options.prompt || "Preserve the subject faithfully."}`;
      const created = await mh("/ai-image-editor", {
        method: "POST",
        body: JSON.stringify({
          name: `MKUU Background Removal ${new Date().toISOString()}`,
          image_count: 1,
          model: "default",
          aspect_ratio: options.aspectRatio || "auto",
          resolution: "auto",
          assets: { image_file_path: filePath },
          style: { prompt },
        }),
      });
      const project = await waitForCompletion(created.id);
      return makeResult(project, options, project?.model || "default");
    } catch (err: any) {
      const message = String(err?.message || err || "");
      const isCreditError = /credit|402|quota|insufficient|balance/i.test(message);
      if (isCreditError) return removeBackgroundFallback(options.sourceImage);
      throw err;
    }
  }

  const filePath = await uploadImage(options.sourceImage);
  let prompt = options.prompt || "Enhance this image while preserving the subject and natural appearance.";
  if (options.mode === "mannequin") prompt = `Place the garment on a professional tailor mannequin with a clean studio background. ${prompt}`;
  if (options.mode === "variation") prompt = `Create a refined visual variation while preserving the main subject. ${prompt}`;
  if (options.mode === "upscale") prompt = `Enhance detail and clarity while preserving the original image faithfully. ${prompt}`;

  const created = await mh("/ai-image-editor", {
    method: "POST",
    body: JSON.stringify({
      name: `MKUU Studio Edit ${new Date().toISOString()}`,
      image_count: 1,
      model: "default",
      aspect_ratio: options.aspectRatio || "auto",
      resolution: "auto",
      assets: { image_file_path: filePath },
      style: { prompt },
    }),
  });
  const project = await waitForCompletion(created.id);
  return makeResult(project, options, project?.model || "default");
}

export function getImageProvider() {
  return { name: "magic_hour", generate: generateImage, edit: editImage };
}
