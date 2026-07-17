import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const PLAN_COSTS = {
  argent: 1,
  silver: 2,
  gold: 5,
} as const;

type Plan = keyof typeof PLAN_COSTS;

export async function POST(req: Request) {
  try {
    const { userId, scenarioId, plan } = await req.json();

    if (!userId || !scenarioId || !plan) {
      return NextResponse.json(
        { error: "userId, scenarioId et plan sont requis" },
        { status: 400 }
      );
    }

    if (!(plan in PLAN_COSTS)) {
      return NextResponse.json(
        { error: "Plan invalide" },
        { status: 400 }
      );
    }

    const selectedPlan = plan as Plan;
    const cost = PLAN_COSTS[selectedPlan];

    const { data: creditData, error: creditError } = await supabaseAdmin
      .from("individual_credits")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (creditError) {
      throw creditError;
    }

    const currentBalance = Number(creditData?.balance || 0);

    if (currentBalance < cost) {
      return NextResponse.json(
        {
          error: "Crédits insuffisants.",
          requiredCredits: cost,
          currentBalance,
        },
        { status: 400 }
      );
    }

    const newBalance = currentBalance - cost;

    const { error: updateError } = await supabaseAdmin
      .from("individual_credits")
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      throw updateError;
    }

    // La page de session vérifie l’existence d’un pass disponible.
    const { error: passError } = await supabaseAdmin
      .from("session_passes")
      .insert({
        user_id: userId,
        scenario_id: scenarioId,
        plan: selectedPlan,
        status: "paid",
      });

    if (passError) {
      // Rembourse le crédit si la création du pass échoue.
      await supabaseAdmin
        .from("individual_credits")
        .update({
          balance: currentBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      throw passError;
    }

    return NextResponse.json({
      success: true,
      cost,
      remainingCredits: newBalance,
    });
  } catch (error) {
    console.error("Erreur utilisation crédits individuels :", error);

    return NextResponse.json(
      { error: "Impossible d’utiliser les crédits." },
      { status: 500 }
    );
  }
}