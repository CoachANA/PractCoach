import OpenAI from "openai";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const AI_CONSENT_VERSION = "1.0";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // 1. Vérifier l'authentification
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace("Bearer ", "");

    // 2. Identifier l'utilisateur
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Utilisateur invalide ou session expirée." },
        { status: 401 }
      );
    }

    // 3. Vérifier le consentement IA
    const { data: consents, error: consentError } = await supabaseAdmin
      .from("ai_consents")
      .select("id")
      .eq("user_id", user.id)
      .eq("consent_version", AI_CONSENT_VERSION)
      .is("revoked_at", null)
      .limit(1);

    if (consentError) {
      console.error(
        "Erreur vérification consentement IA /api/transcribe :",
        consentError
      );

      return NextResponse.json(
        { error: "Impossible de vérifier le consentement IA." },
        { status: 500 }
      );
    }

    // Aucun audio n'est envoyé à OpenAI sans consentement
    if (!consents || consents.length === 0) {
      return NextResponse.json(
        {
          error:
            "Le consentement à l'utilisation des services d'intelligence artificielle est requis.",
        },
        { status: 403 }
      );
    }

    // 4. Récupérer l'audio seulement après les vérifications
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Fichier audio manquant." },
        { status: 400 }
      );
    }

    // 5. Envoi vers OpenAI uniquement après consentement
    const transcription = await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
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