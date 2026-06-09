import OpenAI from "openai";
import { NextResponse } from "next/server";
import { scenarios } from "@/data/scenarios";



type SessionMessage = {
  role: "coach" | "coachee";
  content: string;
};

function getScoreCap(coachMessageCount: number) {
  if (coachMessageCount === 0) return 0;
  if (coachMessageCount === 1) return 15;
  if (coachMessageCount === 2) return 20;
  if (coachMessageCount === 3) return 25;
  if (coachMessageCount === 4) return 30;
  return 100;
}

function getDimensionCaps(coachMessageCount: number) {
  if (coachMessageCount === 0) {
    return { overall: 0, questioning: 0, exploration: 0, posture: 0 };
  }

  if (coachMessageCount === 1) {
    return { overall: 15, questioning: 15, exploration: 12, posture: 10 };
  }

  if (coachMessageCount === 2) {
    return { overall: 20, questioning: 20, exploration: 16, posture: 14 };
  }

  if (coachMessageCount === 3) {
    return { overall: 25, questioning: 25, exploration: 21, posture: 19 };
  }

  if (coachMessageCount === 4) {
    return { overall: 30, questioning: 30, exploration: 26, posture: 24 };
  }

  return { overall: 100, questioning: 100, exploration: 100, posture: 100 };
}

function clampScore(score: number, max: number) {
  return Math.max(0, Math.min(Math.round(score), max));
}

function countRegex(text: string, regex: RegExp) {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function average(a: number, b: number) {
  return Math.round((a + b) / 2);
}

function analyzeCoachSignals(coachMessages: SessionMessage[]) {
  const coachText = coachMessages.map((m) => m.content).join(" ").toLowerCase();

  const totalQuestions = countRegex(coachText, /\?/g);

  const openQuestionMarkers = countRegex(
    coachText,
    /(comment|qu['’]est-ce que|qu['’]est ce que|quels?|quelle|quelles|de quoi|en quoi|sur quoi|que se passe-t-il|qu['’]est-ce qui|qu['’]est ce qui|qu['’]aimerais-tu|qu['’]entends-tu|que veux-tu dire)/gi
  );

  const reformulationMarkers = countRegex(
    coachText,
    /(si je comprends bien|si je t['’]ai bien compris|j['’]entends que|donc pour toi|tu veux dire que|si je t['’]entends bien|en fait, pour toi|ce que j['’]entends)/gi
  );

  const validationMarkers = countRegex(
    coachText,
    /(je vois|j['’]imagine|je comprends|ça a l['’]air|ça semble|ça doit être|je peux comprendre|je vois que|j['’]entends bien|oui, je vois)/gi
  );

  const explorationMarkers = countRegex(
    coachText,
    /(important|ressens|ressenti|peur|envie|besoin|valeur|bloque|blocage|émotion|émotions|frein|hésites|hésitation|vraiment|au fond|pour toi)/gi
  );

  const directiveMarkers = countRegex(
    coachText,
    /(tu devrais|il faut|essaie de|à ta place|tu pourrais juste|fais ceci|fais cela|commence par|il faudrait)/gi
  );

  const shortQuestions = coachMessages.filter((m) => {
    const trimmed = m.content.trim();
    return trimmed.endsWith("?") && trimmed.length < 35;
  }).length;

  return {
    totalQuestions,
    openQuestionMarkers,
    reformulationMarkers,
    validationMarkers,
    explorationMarkers,
    directiveMarkers,
    shortQuestions,
  };
}

function buildHeuristicScores(
  coachMessages: SessionMessage[],
  signals: ReturnType<typeof analyzeCoachSignals>
) {
  const coachMessageCount = coachMessages.length;

  let questioning =
    coachMessageCount * 8 +
    signals.totalQuestions * 10 +
    signals.openQuestionMarkers * 8 -
    signals.shortQuestions * 2 -
    signals.directiveMarkers * 4;

  let exploration =
    coachMessageCount * 5 +
    signals.explorationMarkers * 7 +
    signals.openQuestionMarkers * 4 +
    signals.reformulationMarkers * 5 -
    signals.directiveMarkers * 3;

  let posture =
    coachMessageCount * 5 +
    signals.validationMarkers * 10 +
    signals.reformulationMarkers * 8 -
    signals.directiveMarkers * 6;

  questioning = Math.max(0, Math.min(100, Math.round(questioning)));
  exploration = Math.max(0, Math.min(100, Math.round(exploration)));
  posture = Math.max(0, Math.min(100, Math.round(posture)));

  const overall = Math.round((questioning + exploration + posture) / 3);

  return {
    overall,
    questioning,
    exploration,
    posture,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scenarioId, messages } = body as {
      scenarioId: string;
      messages: SessionMessage[];
    };

    const coachMessages = messages.filter(
      (m) => m.role === "coach" && m.content.trim() !== ""
    );

    const coachMessageCount = coachMessages.length;
    const scoreCap = getScoreCap(coachMessageCount);
    const dimensionCaps = getDimensionCaps(coachMessageCount);

    if (coachMessageCount === 0) {
      return NextResponse.json({
        strengths: [],
        improvements: ["Aucune intervention du coach durant la séance."],
        nextStep:
          "Commence par poser des questions ouvertes et créer un cadre d’échange.",
        overallScore: 0,
        questioning: 0,
        exploration: 0,
        posture: 0,
      });
    }

    const scenario = scenarios.find((item) => item.id === scenarioId);

    if (!scenario) {
      return NextResponse.json(
        { error: "Scénario introuvable." },
        { status: 404 }
      );
    }

    const transcript = messages
      .map((message) => {
        const speaker = message.role === "coach" ? "Coach" : "Coaché";
        return `${speaker}: ${message.content}`;
      })
      .join("\n");

    const signals = analyzeCoachSignals(coachMessages);
    const heuristic = buildHeuristicScores(coachMessages, signals);

    const prompt = `
Tu es un superviseur pédagogique pour coachs débutants.

Ta mission :
analyser une mini séance de coaching et donner un feedback utile, bienveillant, concret et pédagogique.

Contexte du scénario :
- Titre : ${scenario.title}
- Difficulté : ${scenario.difficulty}
- Résumé : ${scenario.summary}

Transcript :
${transcript}

Signaux observés côté coach :
- Nombre de messages du coach : ${coachMessageCount}
- Nombre total de questions : ${signals.totalQuestions}
- Marques de questions ouvertes détectées : ${signals.openQuestionMarkers}
- Marques de reformulation détectées : ${signals.reformulationMarkers}
- Marques de validation émotionnelle détectées : ${signals.validationMarkers}
- Marques d’exploration détectées : ${signals.explorationMarkers}
- Marques directives détectées : ${signals.directiveMarkers}
- Questions très courtes détectées : ${signals.shortQuestions}

Analyse seulement la posture du coach.

Évalue séparément :
1. questioning :
- qualité des questions
- ouverture
- précision
- capacité à relancer

2. exploration :
- capacité à approfondir
- exploration des émotions, besoins, enjeux
- capacité à ne pas rester en surface

3. posture :
- qualité de présence relationnelle dans le langage
- reformulation
- validation émotionnelle
- absence de jugement
- soutien apporté au coaché

Le score global doit être une synthèse cohérente des trois dimensions.
Ne donne pas automatiquement les mêmes scores.
Si les informations sont insuffisantes pour évaluer finement une dimension, donne une note prudente.
Ne surévalue jamais une séance courte.

Réponds uniquement en JSON valide avec cette structure :
{
  "overallScore": 78,
  "questioning": 80,
  "exploration": 74,
  "posture": 79,
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "nextStep": "..."
}

Règles :
- Réponds en français
- Les points doivent être concrets
- Pas de jargon inutile
- 2 points forts max
- 2 axes d’amélioration max
- 1 conseil final court
- Aucun markdown
- Aucun bloc de code
- Les scores sont sur 100
- Donne des nombres entiers
- Les scores doivent être cohérents avec la qualité réelle de la séance
`;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    const raw = response.choices[0]?.message?.content?.trim();

    console.log("RAW FEEDBACK:", raw);

    if (!raw) {
      return NextResponse.json(
        { error: "Aucun feedback généré." },
        { status: 500 }
      );
    }

    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: {
      overallScore: number;
      questioning: number;
      exploration: number;
      posture: number;
      strengths: string[];
      improvements: string[];
      nextStep: string;
    };

    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Erreur parse feedback :", parseError);
      return NextResponse.json(
        {
          error: "Le feedback n'est pas un JSON valide.",
          raw: cleaned,
        },
        { status: 500 }
      );
    }

    // Mélange entre évaluation IA et signaux heuristiques
    // Cela évite les scores identiques et rend les sous-notes plus crédibles.
    const mixedQuestioning = average(parsed.questioning, heuristic.questioning);
    const mixedExploration = average(parsed.exploration, heuristic.exploration);
    const mixedPosture = average(parsed.posture, heuristic.posture);

    // Le score global est une synthèse des trois dimensions,
    // légèrement équilibrée avec le global proposé par l’IA.
    const mixedOverall = Math.round(
      (mixedQuestioning + mixedExploration + mixedPosture + parsed.overallScore) / 4
    );

    return NextResponse.json({
  strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 2) : [],
  improvements: Array.isArray(parsed.improvements)
    ? parsed.improvements.slice(0, 2)
    : [],
  nextStep:
    typeof parsed.nextStep === "string" && parsed.nextStep.trim() !== ""
      ? parsed.nextStep
      : "Continue à pratiquer une posture d’écoute et de questionnement ouvert.",
  overallScore: clampScore(mixedOverall, dimensionCaps.overall),
  questioning: clampScore(mixedQuestioning, dimensionCaps.questioning),
  exploration: clampScore(mixedExploration, dimensionCaps.exploration),
  posture: clampScore(mixedPosture, dimensionCaps.posture),
});
  } catch (error) {
    console.error("Erreur feedback :", error);

    return NextResponse.json(
      { error: "Erreur lors de la génération du feedback." },
      { status: 500 }
    );
  }
}