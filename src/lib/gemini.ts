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
  skinScore: number;
  condition: string;
};

export async function analyzeSkinImage(base64Image: string): Promise<SkinAnalysisResult> {
  if (!API_KEY) {
    throw new Error("Missing VITE_GEMINI_API_KEY in .env.local");
  }

  // Use Gemini 1.5 Flash which is fast and supports vision
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

  const prompt = `
You are an expert veterinary dermatologist AI. Analyze this image of a dog's skin or coat.
Identify any potential skin conditions (like hot spots, ticks, rashes, ringworm, allergies, etc.).
Provide your response strictly as a JSON object matching this TypeScript interface:
{
  "diseaseName": string, // A short name of the condition (e.g. "Flea Allergy Dermatitis")
  "description": string, // A brief 1-2 sentence description of what it looks like
  "urgency": "low" | "medium" | "high", // Severity/Urgency for seeing a vet
  "whatToDo": string, // Actionable immediate steps the owner can take
  "whatNotToDo": string, // What the owner should avoid doing (e.g. "Do not scratch", "Do not apply human cream")
  "foodToAvoid": string, // Any specific foods to avoid if this is allergy related, or just general dietary advice
  "skinScore": number, // A health score from 0 to 100 (100 being perfect skin)
  "condition": string // A short 2-3 word overall condition (e.g. "Moderately Healthy", "Needs Attention")
}
Do not include any Markdown formatting blocks (like \`\`\`json) in your output, just return the raw JSON string.
`;

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
    const cleanText = text.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
    
    const data = JSON.parse(cleanText) as SkinAnalysisResult;
    return data;
  } catch (err) {
    console.error("Gemini API Error:", err);
    throw err;
  }
}

export async function chatWithGemini(
  messages: { role: "user" | "ai"; text: string }[],
  base64Image?: string | null,
  analysisResult?: SkinAnalysisResult | null
): Promise<string> {
  if (!API_KEY) throw new Error("Missing VITE_GEMINI_API_KEY in .env.local");
  
  const model = genAI.getGenerativeModel({ 
    model: "gemini-3.5-flash",
    systemInstruction: "You are a helpful veterinary dermatologist AI assistant. You answer questions about dogs, their skin conditions, health, and general veterinary advice. You are speaking directly to a dog owner."
  });
  
  // Format history for Gemini
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === "ai" ? "model" : "user",
    parts: [{ text: m.text }]
  }));

  const chat = model.startChat({
    history: history,
  });

  const lastMessage = messages[messages.length - 1].text;
  const promptParts: any[] = [lastMessage];

  if (analysisResult && messages.length === 1) {
     promptParts.push("Context: We just scanned the dog's skin and the AI (you) diagnosed it as: " + JSON.stringify(analysisResult));
  }

  if (base64Image && messages.length === 1) {
    const base64Data = base64Image.split(',')[1] || base64Image;
    const mimeType = base64Image.split(';')[0].split(':')[1] || "image/jpeg";
    promptParts.push({
      inlineData: {
        data: base64Data,
        mimeType
      }
    });
  }

  try {
    const result = await chat.sendMessage(promptParts);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error("Gemini Chat Error:", err);
    throw err;
  }
}


export type BreedInsights = {
  behavior: string;
  food: string;
  care: string;
  history: string;
};

export async function getBreedInsights(breedName: string, language: string): Promise<BreedInsights> {
  if (!API_KEY) throw new Error("Missing VITE_GEMINI_API_KEY");
  
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
  
  const langStr = language === "en" ? "English" : "Japanese";
  const prompt = `
You are an expert dog breed historian and veterinarian. Provide detailed insights for the breed: "${breedName}".
Provide the response in ${langStr}.
Return your response strictly as a JSON object matching this TypeScript interface:
{
  "behavior": string, // Detailed paragraph about behavior, personality, and temperament
  "food": string, // Detailed paragraph about dietary needs, recommended food types, and feeding habits
  "care": string, // Detailed paragraph about grooming, exercise requirements, and general care
  "history": string // Detailed paragraph about the breed's origins and history
}
Do not include any Markdown formatting blocks (like \`\`\`json) in your output, just return the raw JSON string.
  `;
  
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleanText = text.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
    return JSON.parse(cleanText) as BreedInsights;
  } catch (err) {
    console.error("Gemini API Error:", err);
    throw err;
  }
}
