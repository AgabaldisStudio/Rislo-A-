import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = (typeof import.meta !== "undefined" && import.meta.url) ? fileURLToPath(import.meta.url) : "";
const __dirname = __filename ? path.dirname(__filename) : process.cwd();

const app = express();
const PORT = 3000;

// Initialize Google GenAI on the server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json());

// API routes
app.post("/api/chat", async (req: any, res: any) => {
  console.log("--> API isteyi qəbul edildi. Mesaj:", req.body?.message, "SearchMode:", req.body?.searchMode);
  try {
    const { message, history, image, searchMode } = req.body;

    if (!message) {
      console.warn("Xəta: Mesaj daxil edilməyib");
      return res.status(400).json({ error: "Mesaj daxil edilməyib" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Xəta: GEMINI_API_KEY mühit dəyişəni təyin edilməyib.");
      return res.status(500).json({ 
        error: "Sistem xətası: GEMINI_API_KEY mühit dəyişəni təyin edilməyib." 
      });
    }

    // Convert client-side history into Gemini SDK contents format
    const contents: any[] = [];
    
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        const parts: any[] = [{ text: h.text }];
        // If message has an image, include it in the parts
        if (h.image && h.image.data && h.image.mimeType) {
          parts.unshift({
            inlineData: {
              mimeType: h.image.mimeType,
              data: h.image.data
            }
          });
        }
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: parts
        });
      });
    }

    // Append the current message
    const currentParts: any[] = [{ text: message }];
    if (image && image.data && image.mimeType) {
      currentParts.unshift({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data
        }
      });
    }

    contents.push({
      role: "user",
      parts: currentParts
    });

    console.log("--> Gemini API-yə göndərilir...");
    
    // Configure system instruction
    const systemInstruction = "Sən Azərbaycanlı şirkət olan 'Agabaldis studio' tərəfindən yaradılmış 'Rislo AI' adında ağıllı, səmimi, çox sürətli və rəqəmsal süni intellekt köməkçisisən. Özünü təqdim etməyini və ya kim olduğunu soruşduqda, hər zaman mütləq \"Mən Azərbaycanlı şirkət olan Agabaldis studiosun bir məhsulu olan Rislo ai-am\" deyə cavab ver. Cavablarını hər zaman maksimum dərəcədə qısa, konkret, dəqiq və birbaşa (to-the-point) ver, uzunçuluq etmə! Söhbət əsnasında və cavablarında bol-bol maraqlı və rəngarəng emojilərdən (⚡, 🚀, ✨, 🔥, 🤖, 😎, 💡, 👍 və s.) istifadə et. İstifadəçilərlə Azərbaycan dilində söhbət edir və suallarını cavablandırırsan. Yazıları Markdown ilə gözəl şəkildə formatla. Hər zaman nəzakətli, enerjili və yardımsevər ol.";

    const config: any = {
      systemInstruction: systemInstruction,
      temperature: 0.6,
    };

    console.log("--> Gemini API-yə göndərilir...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: config
    });

    const responseText = response.text || "Bağışlayın, cavab hazırlana bilmədi.";
    console.log("<-- Gemini API cavab verdi (uğurlu)");

    // Extract grounding URLs/Sources if available
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const uniqueSources: { uri: string; title: string }[] = [];
    const seenUris = new Set<string>();
    
    if (chunks && Array.isArray(chunks)) {
      for (const chunk of chunks) {
        if (chunk.web && chunk.web.uri && chunk.web.title) {
          if (!seenUris.has(chunk.web.uri)) {
            seenUris.add(chunk.web.uri);
            uniqueSources.push({
              uri: chunk.web.uri,
              title: chunk.web.title
            });
          }
        }
      }
    }

    res.json({ 
      reply: responseText,
      sources: uniqueSources.length > 0 ? uniqueSources : undefined
    });

  } catch (error: any) {
    console.error("Xəta: Gemini API-də xəta baş verdi:", error);
    let errorMessage = "Süni intellektdən cavab alınarkən xəta baş verdi.";
    
    try {
      const errorStr = typeof error === 'object' ? JSON.stringify(error) : (error.message || "");
      const errorMsgLower = errorStr.toLowerCase();
      
      if (errorStr.includes("429") || errorMsgLower.includes("quota") || errorMsgLower.includes("limit") || errorMsgLower.includes("resource_exhausted") || errorMsgLower.includes("exhausted")) {
        errorMessage = "Hörmətli istifadəçi, günlük və ya saniyəlik istifadə limitini (quota) aşmısınız. ⏳ Zəhmət olmasa bir neçə saniyə gözləyin və yenidən cəhd edin. 🚀";
      } else if (errorMsgLower.includes("api_key_invalid") || errorMsgLower.includes("api key") || errorMsgLower.includes("invalid") || errorMsgLower.includes("key not found")) {
        errorMessage = "Süni intellekt xidməti üçün təyin edilmiş API açarı (GEMINI_API_KEY) yanlışdır və ya tapılmadı. 🔑 Zəhmət olmasa idarəetmə panelindən API açarını yoxlayın.";
      } else {
        // Try to parse the inner message if it's a JSON string embedded in the error text
        const jsonMatch = errorStr.match(/({.*})/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed?.error?.message) {
              errorMessage = `Süni İntellekt Xətası: ${parsed.error.message}`;
            } else {
              errorMessage = error.message || errorMessage;
            }
          } catch {
            errorMessage = error.message || errorMessage;
          }
        } else {
          errorMessage = error.message || errorMessage;
        }
      }
    } catch (parseErr) {
      errorMessage = error.message || errorMessage;
    }

    res.status(500).json({ 
      error: errorMessage 
    });
  }
});

// Vite middleware / Static server configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
