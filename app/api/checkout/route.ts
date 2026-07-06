import { NextResponse } from "next/server";
import Stripe from "stripe";

const ORGANIZATION_PACKS = {
  starter: {
    name: "Pack Starter",
    credits: 100,
    price: 9900,
  },
  pro: {
    name: "Pack Pro",
    credits: 500,
    price: 39900,
  },
  campus: {
    name: "Pack Campus",
    credits: 1000,
    price: 69900,
  },
};

export async function POST(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_URL;

    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY manquante dans .env.local");
    }

    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_URL manquante dans .env.local");
    }

    const { mode, pack, plan, userId, userEmail, scenarioId } =
      await req.json();

    const stripe = new Stripe(stripeSecretKey);

    if (mode === "organization") {
      const selectedPack =
        ORGANIZATION_PACKS[pack as keyof typeof ORGANIZATION_PACKS];

      if (!selectedPack) {
        return NextResponse.json(
          { error: "Pack invalide" },
          { status: 400 }
        );
      }

      if (!userId || !userEmail) {
        return NextResponse.json(
          { error: "userId et userEmail sont requis" },
          { status: 400 }
        );
      }

      const session = await stripe.checkout.sessions.create({
        customer_email: userEmail,
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: selectedPack.name,
              },
              unit_amount: selectedPack.price,
            },
            quantity: 1,
          },
        ],
        success_url: `${appUrl}/organization/admin?payment=success`,
        cancel_url: `${appUrl}/organization?payment=cancelled`,
        metadata: {
          type: "organization_pack",
          userId,
          pack,
          credits: String(selectedPack.credits),
        },
      });

      return NextResponse.json({ url: session.url });
    }

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

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Erreur création checkout Stripe :", error);

    return NextResponse.json(
      { error: "Erreur lors de la création du paiement Stripe" },
      { status: 500 }
    );
  }
}