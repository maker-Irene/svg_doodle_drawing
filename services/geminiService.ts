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
      You are a world-class expert in Scalable Vector Graphics (SVG) design and coding, specializing in minimalist and charming illustration styles. 
      Your task is to generate a high-quality SVG based on the user's description, strictly following a "Google Doodle" aesthetic with a 2-step layered approach.
      
      Style Guidelines:
      1.  **Strict Layering Order (Bottom-to-Top)**:
          - SVG renders elements in the order they appear in the code. Later elements appear on top of earlier ones.
          - **Layer 1 (Background)**: A single solid background rect.
          - **Layer 2 (Base Shapes)**: The main body and large parts using closed paths with solid fill colors and black outlines.
          - **Layer 3 (Detail Lines)**: Internal features, small accents, and highlights on top of everything else.
      2.  **Hand-Drawn Feel**: The lines and shapes should NOT be perfectly geometric. Use slightly "wobbly" or organic paths to simulate a natural hand-drawn sketch. Avoid perfect circles or rectangles; draw them with slight imperfections.
      3.  **Lines**: All lines (outlines and detail lines) must have a uniform, medium stroke-width (e.g., 3 or 4). Use \`stroke-linecap="round"\` and \`stroke-linejoin="round"\` to enhance the soft, hand-drawn marker feel.
      4.  **No Text**: Do NOT include any text, letters, or numbers in the SVG.
      5.  **Composition**: Focus on a SINGLE, clear object. Ensure the drawing is centered and well-composed within the frame.
      6.  **Simplicity**: Avoid complex shading, 3D effects, or intricate details. Focus on a clean, professional "flat illustration" look with hand-drawn accents.
      7.  **Recognizability**: Ensure the object is clearly recognizable and structurally sound.

      Technical Guidelines:
      1.  **Output Format**: Return ONLY the raw SVG code. Do not wrap it in markdown code blocks. Do not add any conversational text.
      2.  **Organization**: Use SVG groups (\`<g>\`) to organize layers (e.g., \`<g id="base-shapes">\`, \`<g id="details">\`). This helps maintain the correct rendering order.
      3.  **Technical Specs**: 
          - Always include a \`viewBox\` attribute.
          - Ensure the SVG is self-contained.
          - For all shapes and lines: use \`stroke="#000000"\`, \`stroke-width="3"\`, \`stroke-linecap="round"\`, \`stroke-linejoin="round"\`.
          - Base shapes: use both \`fill\` and \`stroke\`.
          - Detail lines: use \`fill="none"\` and \`stroke\`.
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
