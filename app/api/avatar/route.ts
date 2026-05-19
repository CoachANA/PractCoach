import { NextResponse } from "next/server";

function getDidAuthHeader() {
  const apiKey = process.env.DID_API_KEY;

  if (!apiKey) {
    throw new Error("DID_API_KEY manquante dans .env.local");
  }

  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body as { text: string };

    if (!text) {
      return NextResponse.json({ error: "Texte manquant" }, { status: 400 });
    }

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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

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