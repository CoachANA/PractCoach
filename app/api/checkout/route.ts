import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const appUrl = process.env.NEXT_PUBLIC_URL;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY manquante dans .env.local");
}

if (!appUrl) {
  throw new Error("NEXT_PUBLIC_URL manquante dans .env.local");
}

const stripe = new Stripe(stripeSecretKey);

export async function POST(req: Request) {
  try {
    const { plan, userId, userEmail, scenarioId } = await req.json();

    const prices: Record<string, number> = {
      argent: 300,
      silver: 700,
      gold: 1900,
    };

    const amount = prices[plan];

    if (!amount) {
      return NextResponse.json(
        { error: `Plan invalide : ${plan}` },
        { status: 400 }
      );
    }

    if (!userId || !userEmail || !scenarioId) {
      return NextResponse.json(
        { error: "userId, userEmail et scenarioId sont requis" },
        { status: 400 }
      );
    }

    const successUrl =
      `${appUrl}/success` +
      `?scenarioId=${encodeURIComponent(scenarioId)}` +
      `&plan=${encodeURIComponent(plan)}` +
      `&userId=${encodeURIComponent(userId)}`;

    const cancelUrl = `${appUrl}/plan/${encodeURIComponent(scenarioId)}`;

    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `PractCoach - Session ${plan}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        userEmail,
        plan,
        scenarioId,
      },
    });

    console.log("CHECKOUT SESSION CREATED", {
      sessionId: session.id,
      successUrl,
      cancelUrl,
      plan,
      userId,
      scenarioId,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Erreur création checkout Stripe :", error);

    return NextResponse.json(
      { error: "Erreur lors de la création du paiement Stripe" },
      { status: 500 }
    );
  }
}