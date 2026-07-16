import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY manquante dans .env.local");
}

if (!webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET manquante dans .env.local");
}

const stripe = new Stripe(stripeSecretKey);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Signature Stripe manquante" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature error :", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const type = session.metadata?.type;

    if (type === "organization_pack") {
  const userId = session.metadata?.userId;
  const credits = Number(session.metadata?.credits || 0);

  if (!userId || credits <= 0) {
    return NextResponse.json(
      { error: "Metadata organisation invalide" },
      { status: 400 }
    );
  }

  // retrouver l'organisation de l'admin
  const { data: member, error: memberError } = await supabaseAdmin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (memberError) throw memberError;

  if (!member) {
    return NextResponse.json(
      { error: "Organisation introuvable." },
      { status: 404 }
    );
  }

  // lire le total actuel
  const { data: organizationCredits, error: creditsError } =
    await supabaseAdmin
      .from("organization_credits")
      .select("total_credits")
      .eq("organization_id", member.organization_id)
      .maybeSingle();

  if (creditsError) throw creditsError;

  const currentTotal = Number(
    organizationCredits?.total_credits || 0
  );

  // ajouter les crédits achetés
  const { error: updateError } = await supabaseAdmin
    .from("organization_credits")
    .update({
      total_credits: currentTotal + credits,
    })
    .eq("organization_id", member.organization_id);

  if (updateError) throw updateError;

  console.log("Crédits organisation ajoutés ✅", {
    organizationId: member.organization_id,
    added: credits,
    total: currentTotal + credits,
  });

  return NextResponse.json({ received: true });
}

if (type === "individual_pack") {
  const userId = session.metadata?.userId;
  const credits = Number(session.metadata?.credits || 0);
  const offer = session.metadata?.offer;

  if (!userId || credits <= 0 || !offer) {
    return NextResponse.json(
      { error: "Metadata pack individuel invalide" },
      { status: 400 }
    );
  }

  // Vérifie que ce paiement n'a pas déjà été traité
  const { data: existingPurchase } = await supabaseAdmin
    .from("individual_credit_purchases")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (existingPurchase) {
    console.log("Paiement déjà traité.");
    return NextResponse.json({ received: true });
  }

  // Lire le solde actuel
  const { data: existingCredits } = await supabaseAdmin
    .from("individual_credits")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  const currentBalance = existingCredits?.balance ?? 0;

  if (existingCredits) {
    const { error } = await supabaseAdmin
      .from("individual_credits")
      .update({
        balance: currentBalance + credits,
      })
      .eq("user_id", userId);

    if (error) throw error;
  } else {
    const { error } = await supabaseAdmin
      .from("individual_credits")
      .insert({
        user_id: userId,
        balance: credits,
      });

    if (error) throw error;
  }

  // Historique
  const { error: purchaseError } = await supabaseAdmin
    .from("individual_credit_purchases")
    .insert({
      user_id: userId,
      stripe_session_id: session.id,
      offer,
      credits,
      amount_cents: Number(session.metadata?.amountCents),
    });

  if (purchaseError) throw purchaseError;

  console.log("Pack individuel crédité :", {
    userId,
    credits,
  });

  return NextResponse.json({ received: true });
}

    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;
    const scenarioId = session.metadata?.scenarioId;

    if (!userId || !plan || !scenarioId) {
      return NextResponse.json(
        { error: "Metadata Stripe manquante" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("session_passes").insert([
      {
        user_id: userId,
        plan,
        scenario_id: scenarioId,
        status: "paid",
        stripe_session_id: session.id,
      },
    ]);

    if (error) {
      console.error("Erreur insert session_pass :", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Pass créé via webhook ✅", {
      userId,
      plan,
      scenarioId,
      stripeSessionId: session.id,
    });
  }

  return NextResponse.json({ received: true });
}