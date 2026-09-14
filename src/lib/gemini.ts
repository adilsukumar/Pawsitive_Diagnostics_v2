import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export type SkinAnalysisResult = {
  diseaseName: string;
  description: string;
  urgency: "low" | "medium" | "high";
  whatToDo: string;
  whatNotToDo: string;
  foodToAvoid: string;
};

export async function analyzeSkinImage(base64Image: string): Promise<SkinAnalysisResult> {
  if (!API_KEY) {
    throw new Error("Missing VITE_GEMINI_API_KEY in .env.local");
  }

  // Use Gemini 1.5 Flash which is fast and supports vision
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = \
You are an expert veterinary dermatologist AI. Analyze this image of a dog's skin or coat.
Identify any potential skin conditions (like hot spots, ticks, rashes, ringworm, allergies, etc.).
Provide your response strictly as a JSON object matching this TypeScript interface:
{
  "diseaseName": string, // A short name of the condition (e.g. "Flea Allergy Dermatitis")
  "description": string, // A brief 1-2 sentence description of what it looks like
  "urgency": "low" | "medium" | "high", // Severity/Urgency for seeing a vet
  "whatToDo": string, // Actionable immediate steps the owner can take
  "whatNotToDo": string, // What the owner should avoid doing (e.g. "Do not scratch", "Do not apply human cream")
  "foodToAvoid": string // Any specific foods to avoid if this is allergy related, or just general dietary advice
}
Do not include any Markdown formatting blocks (like \\\json) in your output, just return the raw JSON string.
\;

  // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
  const base64Data = base64Image.split(',')[1] || base64Image;
  const mimeType = base64Image.split(';')[0].split(':')[1] || "image/jpeg";

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType
    },
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text().trim();
    
    // Attempt to clean markdown if the model hallucinates it despite instructions
    const cleanText = text.replace(/^\\\(json)?/, '').replace(/\\\$/, '').trim();
    
    const data = JSON.parse(cleanText) as SkinAnalysisResult;
    return data;
  } catch (err) {
    console.error("Gemini API Error:", err);
    throw err;
  }
}
