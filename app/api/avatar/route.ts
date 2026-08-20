import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const AI_CONSENT_VERSION = "1.0";

function getDidAuthHeader() {
  const apiKey = process.env.DID_API_KEY;

  if (!apiKey) {
    throw new Error("DID_API_KEY manquante dans .env.local");
  }

  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

async function getAuthorizedUser(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      ),
    };
  }

  const accessToken = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !user) {
    return {
      error: NextResponse.json(
        { error: "Utilisateur invalide ou session expirée." },
        { status: 401 }
      ),
    };
  }

  const { data: consents, error: consentError } = await supabaseAdmin
    .from("ai_consents")
    .select("id")
    .eq("user_id", user.id)
    .eq("consent_version", AI_CONSENT_VERSION)
    .is("revoked_at", null)
    .limit(1);

  if (consentError) {
    console.error(
      "Erreur vérification consentement IA /api/avatar :",
      consentError
    );

    return {
      error: NextResponse.json(
        { error: "Impossible de vérifier le consentement IA." },
        { status: 500 }
      ),
    };
  }

  if (!consents || consents.length === 0) {
    return {
      error: NextResponse.json(
        {
          error:
            "Le consentement à l'utilisation des services d'intelligence artificielle est requis.",
        },
        { status: 403 }
      ),
    };
  }

  return { user };
}

export async function POST(request: Request) {
  try {
    // 1. Authentification + consentement
    const authorization = await getAuthorizedUser(request);

    if (authorization.error) {
      return authorization.error;
    }

    // 2. Lire le texte
    const body = await request.json();
    const { text } = body as { text: string };

    if (!text?.trim()) {
      return NextResponse.json(
        { error: "Texte manquant" },
        { status: 400 }
      );
    }

    // 3. Seulement maintenant envoyer le texte à D-ID
    const response = await fetch("https://api.d-id.com/talks", {
      method: "POST",
      headers: {
        Authorization: getDidAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        script: {
          type: "text",
          input: text,
          provider: {
            type: "microsoft",
            voice_id: "fr-FR-DeniseNeural",
          },
        },
        source_url:
          "https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.png",
      }),
    });

    const data = await response.json();

    console.log("D-ID POST status:", response.status);
    console.log("D-ID POST data:", data);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Erreur D-ID lors de la création du talk",
          details: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("Erreur avatar POST:", error);

    return NextResponse.json(
      { error: "Erreur avatar POST" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // 1. Authentification + consentement
    const authorization = await getAuthorizedUser(request);

    if (authorization.error) {
      return authorization.error;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID manquant" },
        { status: 400 }
      );
    }

    // 2. Polling D-ID uniquement pour un utilisateur autorisé
    const response = await fetch(`https://api.d-id.com/talks/${id}`, {
      headers: {
        Authorization: getDidAuthHeader(),
      },
    });

    const data = await response.json();

    console.log("D-ID GET status:", response.status);
    console.log("D-ID GET data:", data);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Erreur D-ID lors du polling",
          details: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      status: data.status,
      videoUrl: data.result_url,
    });
  } catch (error) {
    console.error("Erreur avatar GET:", error);

    return NextResponse.json(
      { error: "Erreur avatar GET" },
      { status: 500 }
    );
  }
}