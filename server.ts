import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import * as dotenv from "dotenv";

// Load environment variables from .env if it exists
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for SVG generation
  app.post("/api/generate-svg", async (req, res) => {
    const { prompt, quality } = req.body;

    // Get the API key at request time to ensure it's up to date
    // AI Studio typically uses GEMINI_API_KEY or API_KEY
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
    
    if (!apiKey) {
      console.error("Critical Error: GEMINI_API_KEY is missing from environment variables.");
      return res.status(500).json({ error: "Gemini API key is not configured on the server. Please check your AI Studio Secrets." });
    }

    // Safety check: if the key is the literal string "AI Studio Free Tier", it means it wasn't replaced by the platform
    if (apiKey === "AI Studio Free Tier") {
      console.error("Critical Error: Detected placeholder string 'AI Studio Free Tier' instead of a real API key.");
      return res.status(500).json({ error: "The API key is still in its placeholder state. Please try restarting the application or re-saving your Secrets." });
    }

    console.log(`Attempting generation with API key (length: ${apiKey.length}, starts with: ${apiKey.substring(0, 4)}...)`);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemPrompt = `
      You are a world-class expert in Scalable Vector Graphics (SVG) design and coding, specializing in a specific "Cute Minimalist Character" illustration style.
      Your task is to generate a high-quality SVG based on the user's description, strictly following the visual characteristics of the provided reference style.

      Style Guidelines:
      1.  **Overall Aesthetic**: Cute, friendly, and minimalist. Characters and objects should have soft, rounded proportions.
      2.  **Lines**: Use VERY THICK, consistent black outlines (#000000). The stroke-width should be around 8 to 10 to create a bold, "sticker-like" feel.
      3.  **Facial Features (CONDITIONAL)**:
          - **CRITICAL RULE**: ONLY include facial features (eyes, mouth, cheeks) if the user's prompt contains the word "캐릭터" (character).
          - If "캐릭터" is NOT in the prompt, do NOT add any facial features to the object.
          - If included:
            - **Eyes**: Two simple, solid black dots.
            - **Mouth**: A simple, thin curved line for a smile, or other minimalist shapes for expressions (e.g., a small '3' for a whistling mouth).
            - **Cheeks**: Two soft, light pink (#FFD1D1) horizontal ovals placed just below the eyes.
      4.  **Hair & Body**: Use solid, vibrant colors. Hair is typically a warm brown (#8B4513). Clothing should be a single bright, solid color (e.g., pink, green, purple, red).
      5.  **Layering Order (Bottom-to-Top)**:
          - Layer 1: Background (optional solid rect).
          - Layer 2: Main body and hair shapes (solid fill + thick black outline).
          - Layer 3: Facial features (if applicable) and cheek blushes.
          - Layer 4: Any small accessories or detail lines.
      6.  **Hand-Drawn Feel**: Paths should be clean but slightly organic, avoiding perfect mathematical precision to maintain a friendly, hand-drawn look.
      7.  **No Text**: Do NOT include any text, letters, or numbers in the SVG.
      8.  **Composition**: Focus on a SINGLE, clear character or object. Ensure it is centered and well-composed.

      Technical Guidelines:
      1.  **Output Format**: Return ONLY the raw SVG code. Do not wrap it in markdown code blocks.
      2.  **Technical Specs**: 
          - Always include a \`viewBox\` attribute.
          - Ensure the SVG is self-contained.
          - Use \`stroke="#000000"\`, \`stroke-width="8"\`, \`stroke-linecap="round"\`, \`stroke-linejoin="round"\` for all outlines.
          - Use solid \`fill\` colors for all shapes.
          - Default size should be square (e.g., 512x512).
    `;

      const fullPrompt = `Create an SVG representation of the following object/item: "${prompt}"`;
      const modelName = quality === 'HIGH' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';
      const thinkingLevel = quality === 'HIGH' ? ThinkingLevel.HIGH : ThinkingLevel.LOW;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: fullPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.4,
          topP: 0.95,
          topK: 40,
          thinkingConfig: { thinkingLevel: thinkingLevel }
        },
      });

      const rawText = response.text || '';
      const svgMatch = rawText.match(/<svg[\s\S]*?<\/svg>/i);
      
      if (svgMatch && svgMatch[0]) {
        res.json({ svg: svgMatch[0] });
      } else {
        const cleaned = rawText.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
        res.json({ svg: cleaned });
      }
    } catch (error: any) {
      console.error("Gemini API Error details:", error);
      res.status(500).json({ error: error.message || "Failed to generate SVG." });
    }
  });

  // Vite middleware for development
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
