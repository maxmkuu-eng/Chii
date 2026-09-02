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

const MAGIC_HOUR_BASE_URL = (process.env.MAGIC_HOUR_API_URL || "https://api.magichour.ai/v1").replace(/\/$/, "");
const MAGIC_HOUR_API_KEY = process.env.MAGIC_HOUR_API_KEY;

let studioGallery: GeneratedImageResult[] = [];

export function getGalleryImages(): GeneratedImageResult[] {
  return [...studioGallery];
}

export function saveToGallery(image: GeneratedImageResult): GeneratedImageResult {
  studioGallery.unshift(image);
  if (studioGallery.length > 50) studioGallery = studioGallery.slice(0, 50);
  return image;
}

export function deleteGalleryImage(id: string): boolean {
  const before = studioGallery.length;
  studioGallery = studioGallery.filter((image) => image.id !== id);
  return studioGallery.length !== before;
}

function requireApiKey() {
  if (!MAGIC_HOUR_API_KEY) {
    throw new Error("MAGIC_HOUR_API_KEY haijawekwa kwenye server environment.");
  }
}

async function magicHourRequest(path: string, init: RequestInit = {}): Promise<any> {
  requireApiKey();
  const response = await fetch(`${MAGIC_HOUR_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${MAGIC_HOUR_API_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  let body: any = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { message: text }; }

  if (!response.ok) {
    const message = body?.error?.message || body?.message || text || `Magic Hour API error ${response.status}`;
    if (response.status === 402) throw new Error("Magic Hour haina credits za kutosha kwa picha hii.");
    throw new Error(`Magic Hour (${response.status}): ${message}`);
  }
  return body;
}

async function waitForImageProject(projectId: string): Promise<any> {
  const deadline = Date.now() + 120000;
  let delay = 1200;

  while (Date.now() < deadline) {
    const project = await magicHourRequest(`/image-projects/${encodeURIComponent(projectId)}`);
    if (project.status === "complete") return project;
    if (project.status === "error" || project.status === "canceled") {
      const message = project?.error?.message || project?.error?.detail || "Magic Hour image job failed.";
      throw new Error(message);
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.min(Math.round(delay * 1.25), 4000);
  }

  throw new Error("Magic Hour image generation imechukua muda mrefu sana. Tafadhali jaribu tena.");
}

function getDownloadUrl(project: any): string {
  const url = project?.downloads?.[0]?.url || project?.download?.url;
  if (!url) throw new Error("Magic Hour imemaliza kazi lakini haikurudisha picha.");
  return url;
}

function parseImageSource(sourceImage: string): { bytes: Uint8Array; extension: string } {
  const match = sourceImage.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/s);
  if (!match) throw new Error("Picha ya kuhariri lazima itumwe kama data:image/...;base64,...");
  const subtype = match[1].toLowerCase();
  const extension = subtype === "jpeg" ? "jpg" : subtype === "jpg" ? "jpg" : subtype === "webp" ? "webp" : "png";
  const binary = Buffer.from(match[2], "base64");
  return { bytes: new Uint8Array(binary), extension };
}

async function uploadSourceImage(sourceImage: string): Promise<string> {
  const { bytes, extension } = parseImageSource(sourceImage);
  const upload = await magicHourRequest("/files/upload-urls", {
    method: "POST",
    body: JSON.stringify({ items: [{ extension, type: "image" }] }),
  });

  const item = upload?.items?.[0];
  if (!item?.upload_url || !item?.file_path) throw new Error("Magic Hour haikutoa upload URL ya picha.");

  const putResponse = await fetch(item.upload_url, {
    method: "PUT",
    body: bytes as any,
    headers: { "Content-Type": `image/${extension === "jpg" ? "jpeg" : extension}` },
  });
  if (!putResponse.ok) throw new Error(`Magic Hour image upload failed (${putResponse.status}).`);
  return item.file_path;
}

function resultFromProject(project: any, options: ImageGenerationOptions, model: string): GeneratedImageResult {
  const result: GeneratedImageResult = {
    id: `img-${project.id}`,
    url: getDownloadUrl(project),
    prompt: options.prompt || `Image ${options.mode || "generate"}`,
    aspectRatio: options.aspectRatio || "auto",
    style: options.style || "general",
    mode: options.mode || "generate",
    createdAt: new Date().toISOString(),
    provider: "magic_hour",
    model,
    metadata: {
      magicHourProjectId: project.id,
      creditsCharged: project.credits_charged,
      status: project.status,
    },
  };
  return saveToGallery(result);
}

export async function generateImage(options: ImageGenerationOptions): Promise<GeneratedImageResult> {
  const body = {
    name: `MKUU Studio ${new Date().toISOString()}`,
    image_count: 1,
    model: "default",
    aspect_ratio: options.aspectRatio || "1:1",
    resolution: "auto",
    style: {
      prompt: [options.prompt, options.style ? `Style: ${options.style}` : "", options.negativePrompt ? `Avoid: ${options.negativePrompt}` : ""].filter(Boolean).join("\n"),
      tool: "general",
    },
  };

  const created = await magicHourRequest("/ai-image-generator", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const project = await waitForImageProject(created.id);
  return resultFromProject(project, options, project?.model || "default");
}

export async function editImage(options: ImageGenerationOptions): Promise<GeneratedImageResult> {
  if (!options.sourceImage) throw new Error("sourceImage inahitajika kwa Image Studio edit.");

  const filePath = await uploadSourceImage(options.sourceImage);
  let editPrompt = options.prompt || "Enhance this image while preserving the subject and natural appearance.";

  if (options.mode === "remove_bg") editPrompt = `Remove the background and keep the main subject cleanly isolated. ${editPrompt}`;
  if (options.mode === "mannequin") editPrompt = `Place the garment on a professional tailor mannequin with a clean studio background. ${editPrompt}`;
  if (options.mode === "variation") editPrompt = `Create a refined visual variation while preserving the main subject. ${editPrompt}`;
  if (options.mode === "upscale") editPrompt = `Enhance detail and clarity while preserving the original image faithfully. ${editPrompt}`;

  const body = {
    name: `MKUU Studio Edit ${new Date().toISOString()}`,
    image_count: 1,
    model: "default",
    aspect_ratio: options.aspectRatio || "auto",
    resolution: "auto",
    assets: { image_file_path: filePath },
    style: { prompt: editPrompt },
  };

  const created = await magicHourRequest("/ai-image-editor", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const project = await waitForImageProject(created.id);
  return resultFromProject(project, options, project?.model || "default");
}

export function getImageProvider() {
  return {
    name: "magic_hour",
    generate: generateImage,
    edit: editImage,
  };
}
