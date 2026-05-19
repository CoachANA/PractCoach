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