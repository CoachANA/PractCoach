import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body as { text: string };

    if (!text) {
      return new Response("Texte manquant.", { status: 400 });
    }

    const mp3 = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
    });

    const audioBuffer = Buffer.from(await mp3.arrayBuffer());

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Erreur TTS :", error);
    return new Response("Erreur lors de la génération audio.", { status: 500 });
  }
}