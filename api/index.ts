import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();

// Use JSON parsing with custom limit for image base64 uploads
app.use(express.json({ limit: "20mb" }));

// Initialize the Google GenAI SDK for server-side calls
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API: Nostalgic Caption & Journal generator
app.post("/api/caption", async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image || !mimeType) {
      return res.status(400).json({ error: "Image data and mimeType are required" });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      console.warn("GEMINI_API_KEY is not configured, running in mock/offline mode");
      const fallbacks = [
        { caption: "fading golden hours", story: "A beautiful wash of early evening warmth. The dust was suspended in the air, captured like gold leaf pressed between the pages of an old book." },
        { caption: "quiet afternoon whispers", story: "Outside, the wind held its breath. Inside, a soft vintage camera lens hummed, collecting memories of laughter and cream tea." },
        { caption: "dreaming of est. 1984", story: "Looking back at the grainy edges of yesterday. Some things change entirely, while other memories remain cast in amber forever." },
        { caption: "perfect analog state", story: "A tactile physical digital synthesis. Shadows fall softer, pigments bleed warmer, and our simple moments are made timeless of heart." }
      ];
      const randomFB = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      return res.json(randomFB);
    }

    const promptPart = {
      text: "You are an analog memory curator. Look at this photo and write a nostalgic, poetic journal entry caption for a Polaroid photograph. Provide: 1) A caption (under 6 words, handwritten feel, e.g. 'fading golden hours', 'summer of 1984', 'quiet afternoon whispers'). 2) A short, highly literary, nostalgic diary note (under 30 words, reminiscent of typed typewriter captions). Return strictly a JSON object with keys 'caption' and 'story'."
    };

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: image,
      }
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, promptPart] },
      config: {
        responseMimeType: "application/json",
      }
    });

    const responseText = response.text || "";
    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText.trim());
    } catch (err) {
      const captionMatch = responseText.match(/"caption":\s*"([^"]+)"/);
      const storyMatch = responseText.match(/"story":\s*"([^"]+)"/);
      parsedResult = {
        caption: captionMatch ? captionMatch[1] : "Preserved in Time",
        story: storyMatch ? storyMatch[1] : responseText.replace(/[{}]/g, '').trim() || "A moment saved forever."
      };
    }

    res.json(parsedResult);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Export the app as Vercel serverless entry point
export default app;
