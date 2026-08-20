import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const VALID_PLANS = ["argent", "silver", "gold"] as const;

export async function POST(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY manquante.");
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId requis" },
        { status: 400 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    // Récupérer directement la session auprès de Stripe
    const checkoutSession =
      await stripe.checkout.sessions.retrieve(sessionId);

    // Le paiement doit réellement être validé
    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Le paiement n'est pas validé." },
        { status: 400 }
      );
    }

    const userId = checkoutSession.metadata?.userId;
    const scenarioId = checkoutSession.metadata?.scenarioId;
    const plan = checkoutSession.metadata?.plan;

    if (!userId || !scenarioId || !plan) {
      return NextResponse.json(
        { error: "Métadonnées Stripe incomplètes." },
        { status: 400 }
      );
    }

    if (
      !VALID_PLANS.includes(
        plan as (typeof VALID_PLANS)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Plan invalide." },
        { status: 400 }
      );
    }

    /*
     * Vérifier si CETTE session Stripe a déjà été utilisée
     * pour créer un session pass.
     *
     * On ne regarde volontairement pas le status :
     * le pass peut déjà être "used".
     */
    const { data: existingPass, error: existingPassError } =
      await supabaseAdmin
        .from("session_passes")
        .select("id, status")
        .eq("stripe_session_id", checkoutSession.id)
        .maybeSingle();

    if (existingPassError) {
      throw existingPassError;
    }

    // Créer le pass uniquement si cette session Stripe
    // n'a encore jamais servi.
    if (!existingPass) {
      const { error: insertError } = await supabaseAdmin
        .from("session_passes")
        .insert({
          user_id: userId,
          scenario_id: scenarioId,
          plan,
          status: "paid",
          stripe_session_id: checkoutSession.id,
        });

      if (insertError) {
        throw insertError;
      }
    }

    return NextResponse.json({
      success: true,
      scenarioId,
      plan,
    });
  } catch (error) {
    console.error(
      "Erreur vérification paiement Stripe :",
      error
    );

    return NextResponse.json(
      { error: "Impossible de vérifier le paiement." },
      { status: 500 }
    );
  }
}