import { generateContentWithFallback, AI_CONFIG } from "./ai.js";

export interface VisionAnalysisRequest {
  image: {
    mimeType: string;
    data: string; // base64
    name?: string;
  };
  prompt: string;
  taskType?: "general" | "ocr" | "diagram" | "describe" | "detailed_qa";
  conversationHistory?: Array<{
    role: "user" | "model";
    text: string;
  }>;
}

export async function analyzeVisionImage(req: VisionAnalysisRequest) {
  const base64Data = req.image.data.includes("base64,")
    ? req.image.data.split("base64,")[1]
    : req.image.data;

  const imagePart = {
    inlineData: {
      mimeType: req.image.mimeType || "image/jpeg",
      data: base64Data,
    }
  };

  let systemInstruction = 
    "You are the MKUU AI Vision Intelligence Engine. Analyze visual content with high fidelity, precision, and clarity. " +
    "Safety Guardrail: DO NOT attempt to identify or name private real people or individual individuals in images. Instead describe visual features, attire, expressions, scenery, architecture, text, layout, and diagrams neutrally. " +
    "Provide rich markdown formatting with headers, bullet points, and code formatting where relevant.";

  if (req.taskType === "ocr") {
    systemInstruction += " Focus strictly on extracting all visible text, numbers, labels, signs, and tables with precise transcription.";
  } else if (req.taskType === "diagram") {
    systemInstruction += " Focus on explaining the visual flow, architectural diagrams, charts, graphs, flowcharts, data trends, and relationships.";
  } else if (req.taskType === "describe") {
    systemInstruction += " Provide an exhaustive, vivid description covering foreground, background, color palette, lighting, composition, and subjects.";
  }

  // Construct parts
  const parts: any[] = [imagePart];

  if (req.conversationHistory && req.conversationHistory.length > 0) {
    for (const msg of req.conversationHistory) {
      parts.push({
        text: `[Prior ${msg.role === "user" ? "Question" : "Assistant Response"}]: ${msg.text}`
      });
    }
  }

  parts.push({
    text: req.prompt || (req.taskType === "ocr" ? "Extract all visible text in this image." : "Describe and analyze this image thoroughly.")
  });

  const { text, response } = await generateContentWithFallback({
    preferredModel: AI_CONFIG.defaultTextModel,
    contents: {
      parts: parts
    },
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.4,
    }
  });

  return {
    analysis: text || (response ? response.text : "") || "Uchambuzi umekamilika.",
    taskType: req.taskType || "general",
  };
}

