import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

import { AI_CONFIG, extractCleanErrorMessage } from "./server/services/ai.js";
import { generateChatResponse, generateChatStream } from "./server/services/chatService.js";
import { getMemories, addMemory, updateMemory, deleteMemory, clearAllMemories, extractMemoriesFromText, syncProfileIdentityToMemory } from "./server/services/memoryService.js";
import { analyzeDocuments } from "./server/services/fileService.js";
import { analyzeVisionImage } from "./server/services/visionService.js";
import { getImageProvider, getGalleryImages, deleteGalleryImage } from "./server/services/imageService.js";
import { processVoiceTurn } from "./server/services/voiceService.js";
import { getSearchProvider } from "./server/services/searchService.js";
import { createShareLink, getSharedResource } from "./server/services/sharingService.js";
import { getNotifications, markAsRead, markAllAsRead, clearNotifications, pushNotification } from "./server/services/notificationsService.js";
import { getProfile, updateProfile, getUsage, incrementUsage, resetAccountData } from "./server/services/accountService.js";
import {
  getSimCards,
  updateSimCards,
  getSmsPermissions,
  updateSmsPermissions,
  getAutoReplySettings,
  updateAutoReplySettings,
  toggleEmergencyKillSwitch,
  getSmsNotificationSettings,
  updateSmsNotificationSettings,
  getSmsConversations,
  getSmsConversation,
  deleteSmsConversation,
  batchDeleteSmsConversations,
  clearAllSmsConversations,
  deleteSmsMessage,
  getWatuWangu,
  addWatuWangu,
  updateWatuWangu,
  deleteWatuWangu,
  sendManualSms,
  processIncomingSmsPipeline,
  getAutoReplyLogs,
  clearAutoReplyLogs,
} from "./server/services/smsService.js";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 10000;

  // Middleware for parsing JSON with generous payload limits for base64 images and documents
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------

  // Health check & System Info
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      ok: true,
      name: "MKUU AI Engine",
      version: "2.0.0-modular",
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      activeModel: AI_CONFIG.defaultTextModel,
      providers: {
        ai: AI_CONFIG.defaultTextModel,
        image: {
          provider: AI_CONFIG.imageProvider,
          model: AI_CONFIG.imageGenModel,
        },
        search: {
          provider: AI_CONFIG.searchProvider,
          enabled: AI_CONFIG.searchEnabled,
        },
        voice: {
          provider: AI_CONFIG.voiceProvider,
        },
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Chat - Streaming & Non-streaming
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, systemInstruction, userProfile, temperature, activeMemories, stream } = req.body;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Missing or invalid 'messages' array" });
      }

      if (stream) {
        res.writeHead(200, {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no",
        });

        let isClientDisconnected = false;
        req.on("close", () => {
          isClientDisconnected = true;
        });

        try {
          const streamGenerator = generateChatStream({
            messages,
            systemInstruction,
            userProfile,
            temperature,
            activeMemories,
          });

          let fullAccumulated = "";
          let activeModel = "gemini-3.1-flash-lite";

          for await (const chunk of streamGenerator) {
            if (isClientDisconnected) break;

            if (chunk.isStart) {
              activeModel = chunk.model;
              res.write(`data: ${JSON.stringify({ type: "start", model: chunk.model })}\n\n`);
              continue;
            }

            const textChunk = chunk.text || "";
            if (textChunk) {
              fullAccumulated += textChunk;
              res.write(`data: ${JSON.stringify({ text: textChunk, model: chunk.model })}\n\n`);
            }
          }

          if (!fullAccumulated.trim() && !isClientDisconnected) {
            const emergencyText = "Habari Boss Max! Nipo hapa na tayari kusaidia mara moja. Tafadhali uliza swali lako au niambie unachohitaji.";
            res.write(`data: ${JSON.stringify({ text: emergencyText, model: "mkuu-ai" })}\n\n`);
            fullAccumulated = emergencyText;
          }

          incrementUsage("chat", Math.ceil(fullAccumulated.length / 4) + 150);
          if (!isClientDisconnected) {
            res.write(`data: [DONE]\n\n`);
            res.end();
          }
        } catch (streamErr: any) {
          const cleanMsg = extractCleanErrorMessage(streamErr);
          console.warn("[MKUU AI] Chat streaming notice:", cleanMsg);
          if (!isClientDisconnected) {
            res.write(`data: ${JSON.stringify({ error: cleanMsg || "MKUU AI haikupokea jibu kutoka kwa AI server. Tafadhali jaribu tena." })}\n\n`);
            res.end();
          }
        }
      } else {
        const response = await generateChatResponse({
          messages,
          systemInstruction,
          userProfile,
          temperature,
          activeMemories,
        });

        if (!response.text || !response.text.trim()) {
          return res.status(500).json({
            error: "MKUU AI haikupokea jibu kutoka kwa AI server. Tafadhali jaribu tena."
          });
        }

        incrementUsage("chat", Math.ceil(response.text.length / 4) + 150);
        res.json(response);
      }
    } catch (err: any) {
      const cleanMsg = extractCleanErrorMessage(err);
      console.warn("[MKUU AI] Chat error notice:", cleanMsg);
      res.status(500).json({ error: cleanMsg || "MKUU AI haikupokea jibu kutoka kwa AI server. Tafadhali jaribu tena." });
    }
  });

  // Memory endpoints
  app.get("/api/memory", (_req, res) => {
    res.json({ memories: getMemories() });
  });

  app.post("/api/memory", (req, res) => {
    const { title, content, category, reason, active } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required." });
    }
    const newMem = addMemory({
      title,
      content,
      category: category || "fact",
      reason: reason || "User saved directly in Memory module.",
      active: active !== undefined ? active : true,
    });
    pushNotification({
      title: "Memory Created",
      message: `Saved memory: "${title}"`,
      category: "system",
    });
    res.json(newMem);
  });

  app.put("/api/memory/:id", (req, res) => {
    const updated = updateMemory(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Memory item not found." });
    res.json(updated);
  });

  app.delete("/api/memory/:id", (req, res) => {
    const success = deleteMemory(req.params.id);
    res.json({ success });
  });

  app.delete("/api/memory", (_req, res) => {
    clearAllMemories();
    res.json({ success: true, message: "All memories cleared." });
  });

  app.post("/api/memory/extract", async (req, res) => {
    const { text } = req.body;
    if (!text) return res.json({ suggestions: [] });
    const suggestions = await extractMemoriesFromText(text);
    res.json({ suggestions });
  });

  // Files Intelligence endpoints
  app.post("/api/files/analyze", async (req, res) => {
    try {
      const { files, prompt, mode } = req.body;
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: "At least one file is required for analysis." });
      }

      const result = await analyzeDocuments({
        files,
        prompt: prompt || "",
        mode: mode || "summary",
      });

      incrementUsage("files", 800);
      pushNotification({
        title: "File Analysis Complete",
        message: `Processed ${files.length} document(s) in ${mode || "summary"} mode.`,
        category: "files",
      });

      res.json(result);
    } catch (err: any) {
      console.error("File analysis error:", err);
      res.status(500).json({ error: err?.message || "Failed to analyze document(s)." });
    }
  });

  // Vision endpoints
  app.post("/api/vision/analyze", async (req, res) => {
    try {
      const { image, prompt, taskType, conversationHistory } = req.body;
      if (!image || !image.data) {
        return res.status(400).json({ error: "Image data is required for vision analysis." });
      }

      const result = await analyzeVisionImage({
        image,
        prompt,
        taskType,
        conversationHistory,
      });

      incrementUsage("vision", 650);
      res.json(result);
    } catch (err: any) {
      console.error("Vision analysis error:", err);
      res.status(500).json({ error: err?.message || "Failed to analyze image." });
    }
  });

  // Studio Image endpoints (Replaceable Image Provider)
  app.post("/api/images/generate", async (req, res) => {
    try {
      const { prompt, negativePrompt, aspectRatio, style, mode, sourceImage } = req.body;
      if (!prompt && mode !== "remove_bg") {
        return res.status(400).json({ error: "Prompt is required for image generation." });
      }

      const provider = getImageProvider();
      let result;
      if (mode && mode !== "generate") {
        result = await provider.edit({ prompt, negativePrompt, aspectRatio, style, mode, sourceImage });
      } else {
        result = await provider.generate({ prompt, negativePrompt, aspectRatio, style, mode: "generate" });
      }

      incrementUsage("studio", 1200);
      pushNotification({
        title: "Studio Image Rendered",
        message: `Generated image: "${(prompt || mode).substring(0, 30)}..."`,
        category: "studio",
      });

      res.json(result);
    } catch (err: any) {
      console.error("Image generation error:", err);
      res.status(500).json({ error: err?.message || "Failed to generate image." });
    }
  });

  app.get("/api/images/gallery", (_req, res) => {
    res.json({ images: getGalleryImages() });
  });

  app.delete("/api/images/gallery/:id", (req, res) => {
    const success = deleteGalleryImage(req.params.id);
    res.json({ success });
  });

  // Voice endpoint
  app.post("/api/voice/turn", async (req, res) => {
    try {
      const { transcript, voicePersona, conversationHistory } = req.body;
      if (!transcript) {
        return res.status(400).json({ error: "Transcript is required." });
      }

      const result = await processVoiceTurn({
        transcript,
        voicePersona,
        conversationHistory,
      });

      incrementUsage("voice", 300);
      res.json(result);
    } catch (err: any) {
      console.error("Voice turn error:", err);
      res.status(500).json({ error: err?.message || "Failed to process voice request." });
    }
  });

  // Live Web Search architectural endpoint (Placeholder ready for swap)
  app.get("/api/search", async (req, res) => {
    const query = (req.query.q as string) || "";
    const searchProvider = getSearchProvider();
    const result = await searchProvider.search(query);
    res.json(result);
  });

  // Share & Export endpoints
  app.post("/api/share", (req, res) => {
    const { resourceType, title, content } = req.body;
    if (!resourceType || !content) {
      return res.status(400).json({ error: "resourceType and content are required." });
    }
    const result = createShareLink(resourceType, title || "Shared MKUU AI Resource", content);
    res.json(result);
  });

  app.get("/api/share/:id", (req, res) => {
    const resource = getSharedResource(req.params.id);
    if (!resource) return res.status(404).json({ error: "Shared item not found or expired." });
    res.json(resource);
  });

  // Notifications endpoints
  app.get("/api/notifications", (_req, res) => {
    res.json({ notifications: getNotifications() });
  });

  app.post("/api/notifications/read", (req, res) => {
    const { id } = req.body;
    if (id) {
      markAsRead(id);
    } else {
      markAllAsRead();
    }
    res.json({ success: true });
  });

  app.delete("/api/notifications", (_req, res) => {
    clearNotifications();
    res.json({ success: true });
  });

  // Account & Security endpoints
  app.get("/api/account/profile", (_req, res) => {
    res.json({ profile: getProfile() });
  });

  app.put("/api/account/profile", (req, res) => {
    const updated = updateProfile(req.body);
    if (updated.syncWithMemory) {
      syncProfileIdentityToMemory(updated);
    }
    res.json({ profile: updated });
  });

  app.get("/api/account/usage", (_req, res) => {
    res.json({ usage: getUsage() });
  });

  app.post("/api/account/reset", (_req, res) => {
    resetAccountData();
    res.json({ success: true, message: "Account data reset successfully." });
  });

  // -------------------------------------------------------------
  // SMS & AUTO REPLY ENDPOINTS
  // -------------------------------------------------------------

  // SIM Cards
  app.get("/api/sms/sims", (_req, res) => {
    res.json({ sims: getSimCards() });
  });

  app.put("/api/sms/sims", (req, res) => {
    const { updates } = req.body;
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: "Missing or invalid 'updates' array." });
    }
    const updated = updateSimCards(updates);
    res.json({ sims: updated });
  });

  // Permissions
  app.get("/api/sms/permissions", (_req, res) => {
    res.json({ permissions: getSmsPermissions() });
  });

  app.put("/api/sms/permissions", (req, res) => {
    const updated = updateSmsPermissions(req.body);
    res.json({ permissions: updated });
  });

  // SMS Inbox & Conversations
  app.get("/api/sms/inbox", (_req, res) => {
    res.json({ conversations: getSmsConversations() });
  });

  app.delete("/api/sms/inbox", (_req, res) => {
    clearAllSmsConversations();
    res.json({ success: true, message: "All SMS conversations cleared." });
  });

  app.post("/api/sms/threads/batch-delete", (req, res) => {
    const { threadIds } = req.body;
    if (!threadIds || !Array.isArray(threadIds)) {
      return res.status(400).json({ error: "Missing or invalid 'threadIds' array." });
    }
    const result = batchDeleteSmsConversations(threadIds);
    res.json({ success: true, ...result });
  });

  app.get("/api/sms/threads/:id", (req, res) => {
    const thread = getSmsConversation(req.params.id);
    if (!thread) return res.status(404).json({ error: "SMS Conversation not found." });
    res.json({ conversation: thread });
  });

  app.delete("/api/sms/threads/:id", (req, res) => {
    const success = deleteSmsConversation(req.params.id);
    if (!success) return res.status(404).json({ error: "SMS Thread not found or already deleted." });
    res.json({ success: true, message: "SMS Thread deleted successfully." });
  });

  app.delete("/api/sms/threads/:threadId/messages/:messageId", (req, res) => {
    const result = deleteSmsMessage(req.params.threadId, req.params.messageId);
    if (!result.success) {
      return res.status(404).json({ error: "Message or thread not found." });
    }
    res.json({ success: true, conversation: result.thread });
  });

  // Emergency Kill Switch
  app.post("/api/sms/auto-reply/kill-switch", (req, res) => {
    const { active } = req.body;
    const result = toggleEmergencyKillSwitch(typeof active === 'boolean' ? active : undefined);
    res.json({ success: true, ...result });
  });

  // Watu Wangu (VIP & Inner Circle Contacts)
  app.get("/api/sms/watu-wangu", (_req, res) => {
    res.json({ contacts: getWatuWangu() });
  });

  app.post("/api/sms/watu-wangu", (req, res) => {
    const { name, nickname, phoneNumber, relationship, autoReplyBehavior, customReplyMessage, isPriority, notes, avatarColor } = req.body;
    if (!name || !phoneNumber) {
      return res.status(400).json({ error: "Name and phone number are required." });
    }
    const newContact = addWatuWangu({
      name,
      nickname,
      phoneNumber,
      relationship: relationship || 'Familia',
      autoReplyBehavior: autoReplyBehavior || 'ai_custom',
      customReplyMessage,
      isPriority: Boolean(isPriority),
      notes,
      avatarColor: avatarColor || 'amber',
    });
    res.status(201).json({ contact: newContact });
  });

  app.put("/api/sms/watu-wangu/:id", (req, res) => {
    const updated = updateWatuWangu(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Watu Wangu contact not found." });
    }
    res.json({ contact: updated });
  });

  app.delete("/api/sms/watu-wangu/:id", (req, res) => {
    const success = deleteWatuWangu(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Watu Wangu contact not found." });
    }
    res.json({ success: true, message: "Contact deleted from Watu Wangu." });
  });

  // Manual SMS Sending
  app.post("/api/sms/send", (req, res) => {
    try {
      const { recipient, recipientName, content, simSlot } = req.body;
      const result = sendManualSms({
        recipient,
        recipientName,
        content,
        simSlot: simSlot || "SIM 1",
      });
      res.json(result);
    } catch (err: any) {
      console.error("SMS sending error:", err);
      res.status(400).json({ error: err?.message || "Failed to send SMS" });
    }
  });

  // Auto Reply Settings
  app.get("/api/sms/auto-reply/settings", (_req, res) => {
    res.json({ settings: getAutoReplySettings() });
  });

  app.put("/api/sms/auto-reply/settings", (req, res) => {
    const updated = updateAutoReplySettings(req.body);
    res.json({ settings: updated });
  });

  // Simulate or Ingest Incoming SMS Event (Triggers Full Auto Reply Pipeline)
  app.post("/api/sms/auto-reply/simulate-incoming", async (req, res) => {
    try {
      const { sender, senderName, content, simSlot } = req.body;
      if (!sender || !content) {
        return res.status(400).json({ error: "Sender and content are required." });
      }

      const result = await processIncomingSmsPipeline({
        sender,
        senderName,
        content,
        simSlot: simSlot || "SIM 1",
      });

      res.json(result);
    } catch (err: any) {
      console.error("Auto Reply processing error:", err);
      res.status(500).json({ error: err?.message || "Failed to process incoming SMS event" });
    }
  });

  // Auto Reply Logs & History
  app.get("/api/sms/auto-reply/history", (_req, res) => {
    res.json({ logs: getAutoReplyLogs() });
  });

  app.delete("/api/sms/auto-reply/history", (_req, res) => {
    clearAutoReplyLogs();
    res.json({ success: true, message: "Auto Reply history cleared." });
  });

  // SMS Notification Settings
  app.get("/api/sms/notifications/settings", (_req, res) => {
    res.json({ settings: getSmsNotificationSettings() });
  });

  app.put("/api/sms/notifications/settings", (req, res) => {
    const updated = updateSmsNotificationSettings(req.body);
    res.json({ settings: updated });
  });

  // -------------------------------------------------------------
  // VITE MIDDLEWARE (Development) vs STATIC SERVING (Production)
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[MKUU AI] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
