import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const AI_CONSENT_VERSION = "1.0";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. Vérifier le token envoyé par l'utilisateur
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return new Response("Non autorisé.", { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    // 2. Identifier l'utilisateur avec Supabase
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response("Session utilisateur invalide.", { status: 401 });
    }

    // 3. Vérifier le consentement IA en base
    const { data: consent, error: consentError } = await supabaseAdmin
      .from("ai_consents")
      .select("id")
      .eq("user_id", user.id)
      .eq("consent_version", AI_CONSENT_VERSION)
      .is("revoked_at", null)
      .maybeSingle();

    if (consentError) {
      console.error("Erreur vérification consentement IA :", consentError);

      return new Response(
        "Erreur lors de la vérification du consentement.",
        { status: 500 }
      );
    }

    if (!consent) {
      return new Response("Consentement IA requis.", { status: 403 });
    }

    // 4. Lire le texte
    const body = await request.json();
    const { text } = body as { text: string };

    if (!text?.trim()) {
      return new Response("Texte manquant.", { status: 400 });
    }

    // 5. Seulement maintenant appeler OpenAI
    const mp3 = await client.audio.speech.create({
      model: "tts-1",
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

    return new Response(
      "Erreur lors de la génération audio.",
      { status: 500 }
    );
  }
}