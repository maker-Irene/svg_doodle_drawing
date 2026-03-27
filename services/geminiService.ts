/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { GenerationQuality } from "../types";

// Initialize the client
// CRITICAL: We use process.env.API_KEY as per strict guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates an SVG string based on the user's prompt with retry logic.
 * @param prompt The user's description
 * @param quality The desired generation quality (FAST or HIGH)
 */
export const generateSvgFromPrompt = async (prompt: string, quality: GenerationQuality = GenerationQuality.FAST): Promise<string> => {
  const maxRetries = 3;
  let retryCount = 0;

  const attemptGeneration = async (): Promise<string> => {
    try {
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
      5.  **Limbs (Human Characters)**: When drawing human characters, do NOT represent limbs (arms and legs) as simple lines. Instead, use filled, rounded shapes (like rounded rectangles or ovals) to give them volume and maintain the cute, minimalist aesthetic.
      6.  **Layering Order (Bottom-to-Top)**:
          - Layer 1: Background (optional solid rect).
          - Layer 2: Main body and hair shapes (solid fill + thick black outline).
          - Layer 3: Facial features (if applicable) and cheek blushes.
          - Layer 4: Any small accessories or detail lines.
      7.  **Hand-Drawn Feel**: Paths should be clean but slightly organic, avoiding perfect mathematical precision to maintain a friendly, hand-drawn look.
      8.  **No Text**: Do NOT include any text, letters, or numbers in the SVG.
      9.  **Composition**: Focus on a SINGLE, clear character or object. Ensure it is centered and well-composed.

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

      const modelName = quality === GenerationQuality.HIGH ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';
      const thinkingLevel = quality === GenerationQuality.HIGH ? ThinkingLevel.HIGH : ThinkingLevel.LOW;

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
      
      // Robust cleanup to extract just the SVG part
      const svgMatch = rawText.match(/<svg[\s\S]*?<\/svg>/i);
      
      if (svgMatch && svgMatch[0]) {
        return svgMatch[0];
      } else {
        return rawText.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
      }

    } catch (error: any) {
      // Handle 429 Resource Exhausted error with retry
      const errorStr = JSON.stringify(error);
      const isQuotaError = 
        error.message?.includes("429") || 
        error.status === "RESOURCE_EXHAUSTED" ||
        error.error?.code === 429 ||
        error.error?.status === "RESOURCE_EXHAUSTED" ||
        errorStr.includes("429") ||
        errorStr.includes("RESOURCE_EXHAUSTED");

      if (isQuotaError) {
        if (retryCount < maxRetries) {
          retryCount++;
          // Exponential backoff with a bit of jitter: (2^retry * 1000) + random(0-1000)
          const delay = Math.pow(2, retryCount) * 1000 + Math.floor(Math.random() * 1000);
          console.warn(`Quota exceeded. Retrying in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptGeneration();
        }
      }
      
      console.error("Gemini API Error:", error);
      throw new Error(error.message || errorStr || "Failed to generate SVG.");
    }
  };

  return attemptGeneration();
};
