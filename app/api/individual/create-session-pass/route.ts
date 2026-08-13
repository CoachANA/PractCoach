import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const VALID_PLANS = ["argent", "silver", "gold"] as const;

export async function POST(req: Request) {
  try {
    const { userId, scenarioId, plan } = await req.json();

    if (!userId || !scenarioId || !plan) {
      return NextResponse.json(
        { error: "userId, scenarioId et plan sont requis" },
        { status: 400 }
      );
    }

    if (!VALID_PLANS.includes(plan)) {
      return NextResponse.json(
        { error: "Plan invalide" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("session_passes")
      .insert({
        user_id: userId,
        scenario_id: scenarioId,
        plan,
        status: "paid",
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Erreur création session pass RevenueCat :", error);

    return NextResponse.json(
      { error: "Impossible de créer le pass de session." },
      { status: 500 }
    );
  }
}