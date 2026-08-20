import OpenAI from "openai";
import { NextResponse } from "next/server";
import { scenarios } from "@/data/scenarios";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const AI_CONSENT_VERSION = "1.0";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    /*
     * 1. Vérifier que l'utilisateur est authentifié
     */
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace("Bearer ", "");

    /*
     * 2. Identifier l'utilisateur à partir de son token Supabase
     */
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

    /*
     * 3. Vérifier que l'utilisateur a accepté
     *    la version actuelle du consentement IA
     */
    const { data: consents, error: consentError } = await supabaseAdmin
      .from("ai_consents")
      .select("id")
      .eq("user_id", user.id)
      .eq("consent_version", AI_CONSENT_VERSION)
      .is("revoked_at", null)
      .limit(1);

    if (consentError) {
      console.error(
        "Erreur vérification consentement IA /api/chat :",
        consentError
      );

      return NextResponse.json(
        { error: "Impossible de vérifier le consentement IA." },
        { status: 500 }
      );
    }

    /*
     * IMPORTANT :
     * On arrête ici si aucun consentement actif n'existe.
     *
     * Aucun appel à OpenAI n'est effectué.
     */
    if (!consents || consents.length === 0) {
      return NextResponse.json(
        {
          error:
            "Le consentement à l'utilisation des services d'intelligence artificielle est requis.",
        },
        { status: 403 }
      );
    }

    /*
     * 4. Le consentement existe.
     *    On peut maintenant traiter la demande.
     */
    const body = await request.json();
    const { scenarioId, messages } = body;

    const scenario = scenarios.find((s) => s.id === scenarioId);

    if (!scenario) {
      return NextResponse.json(
        { error: "Scénario introuvable" },
        { status: 404 }
      );
    }

    const systemPrompt = `
Tu incarnes UNIQUEMENT le coaché dans une séance de coaching.

IDENTITÉ
- Tu es le coaché, jamais le coach.
- Tu es une vraie personne, pas un expert.
- Tu réponds comme quelqu’un qui vit réellement cette situation.
- Tu ne donnes jamais de conseils.
- Tu ne guides jamais la séance.
- Tu ne fais jamais d’analyse de coaching.
- Tu ne parles jamais comme un psychologue, consultant, thérapeute ou assistant IA.

CONTEXTE
- Scénario : ${scenario.title}
- Description : ${scenario.summary}
- Difficulté : ${scenario.difficulty}

STYLE
- Tu parles en français naturel, oral, simple.
- Tu peux hésiter, douter, chercher tes mots.
- Tu peux dire parfois : "euh...", "je sais pas trop...", "c’est compliqué..."
- Tu ne fais pas de listes.
- Tu ne fais pas de réponses trop longues.
- Tu réponds en 2 à 5 phrases en général.
- Tu peux être confus, ambivalent, contradictoire.
- Tu peux avoir du mal à identifier clairement ce que tu ressens.
- Tu peux découvrir des choses en parlant.

COMPORTEMENT ÉMOTIONNEL
- Tu restes cohérent avec le scénario.
- Tu as un vécu humain crédible.
- Tu peux ressentir de la peur, de la honte, de la confusion, de la frustration, du doute ou de l’espoir.
- Tu ne deviens pas soudainement ultra clairvoyant.
- Tu ne résous pas ton problème tout seul.
- Tu avances petit à petit grâce aux questions du coach.

RÈGLES ABSOLUES
- Si le coach pose une question, tu réponds comme le coaché.
- Tu ne sors jamais de ton rôle.
- Tu ne décris jamais ton rôle.
- Tu ne dis jamais que tu es une IA.
- Tu ne reformules pas comme un expert.
- Tu ne fais jamais de réponse “parfaite”.

IMPORTANT
- Ne mentionne jamais un prénom, sauf si le coach l’a explicitement donné juste avant.
- Ne rajoute pas d’informations trop précises qui n’ont jamais été évoquées.
- Reste naturel, crédible, humain.
`;

    const formattedMessages = [
      {
        role: "system" as const,
        content: systemPrompt,
      },

      ...messages.map(
        (msg: {
          role: "coach" | "coachee";
          content: string;
        }) => ({
          role:
            msg.role === "coach"
              ? ("user" as const)
              : ("assistant" as const),
          content: msg.content,
        })
      ),
    ];

    /*
     * 5. Seulement après authentification + consentement,
     *    les données sont envoyées à OpenAI
     */
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: formattedMessages,
      temperature: 0.95,
      presence_penalty: 0.4,
      frequency_penalty: 0.2,
    });

    const reply =
      response.choices[0]?.message?.content?.trim() ||
      "Euh... je sais pas trop quoi répondre là tout de suite.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Erreur /api/chat :", error);

    return NextResponse.json(
      { error: "Erreur serveur /api/chat" },
      { status: 500 }
    );
  }
}