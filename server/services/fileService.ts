import { generateContentWithFallback, AI_CONFIG } from "./ai.js";

export interface DocumentAnalysisRequest {
  files: Array<{
    name: string;
    type: string;
    size: number;
    content: string; // base64 or raw text
  }>;
  prompt: string;
  mode: "summary" | "qa" | "extract" | "compare" | "action_items";
}

export async function analyzeDocuments(req: DocumentAnalysisRequest) {
  const parts: any[] = [];

  for (const file of req.files) {
    const fileType = (file.type || "").toLowerCase();
    if (fileType.startsWith("image/")) {
      const base64Data = file.content.includes("base64,") ? file.content.split("base64,")[1] : file.content;
      parts.push({
        inlineData: {
          mimeType: file.type || "image/jpeg",
          data: base64Data,
        }
      });
      parts.push({ text: `[Image Document: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]` });
    } else {
      // Text, PDF textual representation, Markdown, Code, CSV, etc.
      let textContent = file.content;
      if (file.content.includes("base64,")) {
        try {
          const rawBase64 = file.content.split("base64,")[1];
          textContent = Buffer.from(rawBase64, "base64").toString("utf-8");
        } catch {
          textContent = file.content;
        }
      }
      parts.push({
        text: `--- START OF DOCUMENT: ${file.name} (${file.type}) ---\n${textContent}\n--- END OF DOCUMENT: ${file.name} ---`
      });
    }
  }

  let taskInstruction = "";
  switch (req.mode) {
    case "summary":
      taskInstruction = "Provide an executive summary of the provided document(s), highlighting key takeaways, core themes, and essential conclusions in well-organized bullet points.";
      break;
    case "compare":
      taskInstruction = "Perform a deep comparative analysis across the provided documents. Identify key similarities, critical differences, conflicting statements, unique points in each file, and a synthesis table or breakdown.";
      break;
    case "extract":
      taskInstruction = "Extract all critical data points, dates, numerical figures, entities, stakeholder names, and key metrics from the document(s) in a structured format.";
      break;
    case "action_items":
      taskInstruction = "Identify all action items, deliverables, deadlines, responsibilities, and next steps mentioned across the document(s).";
      break;
    case "qa":
    default:
      taskInstruction = "Answer the user's inquiry based thoroughly and accurately on the provided document(s).";
      break;
  }

  const promptText = `${taskInstruction}\n\nUser Query/Instructions:\n${req.prompt || "Please process the document(s) according to the selected mode."}`;
  parts.push({ text: promptText });

  const { text, response } = await generateContentWithFallback({
    preferredModel: AI_CONFIG.defaultTextModel,
    contents: {
      parts: parts
    },
    config: {
      systemInstruction: "You are the MKUU AI Files Intelligence Engine. You analyze documents with meticulous attention to detail, citing relevant sections, comparing multi-document inputs accurately, and providing crystal-clear structured outputs.",
    }
  });

  return {
    result: text || (response ? response.text : "") || "Uchambuzi wa faili umekamilika.",
    filesAnalyzed: req.files.map(f => f.name),
    mode: req.mode,
  };
}
