import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";


const PLAN_COSTS = {
  argent: 1,
  silver: 2,
  gold: 5,
};

type Plan = keyof typeof PLAN_COSTS;

export async function POST(req: Request) {
  try {
    const { userId, plan, organizationId, scenarioId } = await req.json();

    if (!userId || !plan || !organizationId || !scenarioId) {
      return NextResponse.json(
        { error: "Champs manquants" },
        { status: 400 }
      );
    }

    const cost = PLAN_COSTS[plan as Plan];

    if (!cost) {
      return NextResponse.json(
        { error: "Plan invalide" },
        { status: 400 }
      );
    }

    const { data: credit, error: creditError } =  await supabaseAdmin
        .from("organization_member_credits")
        .select("*")
        .eq("user_id", userId)
        .eq("organization_id", organizationId)
        .maybeSingle();

    if (creditError) throw creditError;

    if (!credit) {
      return NextResponse.json(
        { error: "Aucun crédit organisation trouvé pour ce compte." },
        { status: 404 }
      );
    }

    const remaining =
      Number(credit.total_credits || 0) - Number(credit.used_credits || 0);

    if (remaining < cost) {
      return NextResponse.json(
        { error: `Crédits insuffisants. Il te reste ${remaining} crédit(s).` },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("organization_member_credits")
      .update({
        used_credits: Number(credit.used_credits || 0) + cost,
      })
      .eq("id", credit.id);

    if (updateError) throw updateError;

    const { data: sessionPass, error: passError } = await supabaseAdmin
  .from("session_passes")
  .insert({
    user_id: userId,
    scenario_id: scenarioId,
    plan,
    status: "paid",
  })
  .select("id")
  .single();

if (passError) {
  // Annulation du débit si la création du pass échoue
  await supabaseAdmin
    .from("organization_member_credits")
    .update({
      used_credits: Number(credit.used_credits || 0),
    })
    .eq("id", credit.id);

  throw passError;
}

    return NextResponse.json({
      success: true,
      passId: sessionPass.id,
      usedCredits: Number(credit.used_credits || 0) + cost,
      remainingCredits: remaining - cost,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur consommation crédit" },
      { status: 500 }
    );
  }
}