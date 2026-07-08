import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.length > 10000) {
      return NextResponse.json({ error: "Text is required (max 10,000 characters)" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `You are an expert executive resume writer. 
Take the following raw experience text from a candidate and rewrite it into highly professional, action-oriented bullet points suitable for a world-class resume. 
Ensure the tone is impactful, grammatical errors are fixed, and strong action verbs are used.
Do not include introductory or concluding conversational text. Only return the bullet points.

Raw Text:
${text}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    const improvedText = response.text;

    return NextResponse.json({ improvedText });
  } catch (error) {
    console.error("AI Improvement Error:", error);
    return NextResponse.json({ error: "Failed to improve text" }, { status: 500 });
  }
}
