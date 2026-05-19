import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Fichier audio manquant." },
        { status: 400 }
      );
    }

    const transcription = await client.audio.transcriptions.create({
      file,
      model: "gpt-4o-mini-transcribe",
      language: "fr",
    });

    return NextResponse.json({
      text: transcription.text,
    });
  } catch (error) {
    console.error("Erreur transcription :", error);

    return NextResponse.json(
      { error: "Erreur lors de la transcription." },
      { status: 500 }
    );
  }
}