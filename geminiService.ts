
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getMusicRecommendations = async (userInput: string) => {
  if (!process.env.API_KEY) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The user is looking for Tamil music with this description: "${userInput}". 
      Based on Tamil cinema knowledge, suggest 3-5 songs that match this vibe. 
      Return the response in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              song: { type: Type.STRING },
              movie: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["song", "movie", "reason"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Music Recommendation Error:", error);
    return null;
  }
};
