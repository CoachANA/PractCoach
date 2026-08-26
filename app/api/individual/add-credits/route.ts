import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const VALID_OFFERS = {
  discovery: 3,
  training: 10,
} as const;

type Offer = keyof typeof VALID_OFFERS;

export async function POST(req: Request) {
  try {
    const { userId, offer, transactionId } = await req.json();

    if (!userId || !offer || !transactionId) {
      return NextResponse.json(
        { error: "userId, offer et transactionId sont requis" },
        { status: 400 }
      );
    }

    if (!(offer in VALID_OFFERS)) {
      return NextResponse.json(
        { error: "Offre invalide" },
        { status: 400 }
      );
    }

    const selectedOffer = offer as Offer;
    const credits = VALID_OFFERS[selectedOffer];

    // Vérifie que cet achat RevenueCat n'a pas déjà été traité
    const { data: existingPurchase, error: existingPurchaseError } =
      await supabaseAdmin
        .from("individual_credit_purchases")
        .select("id")
        .eq("revenuecat_transaction_id", transactionId)
        .maybeSingle();

    if (existingPurchaseError) {
      throw existingPurchaseError;
    }

    if (existingPurchase) {
  const { data: existingCredits, error: existingCreditsError } =
    await supabaseAdmin
      .from("individual_credits")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

  if (existingCreditsError) {
    throw existingCreditsError;
  }

  return NextResponse.json({
    success: true,
    alreadyProcessed: true,
    creditsAdded: 0,
    balance: Number(existingCredits?.balance || 0),
  });
}

    // Lire le solde actuel
    const { data: creditData, error: creditError } = await supabaseAdmin
      .from("individual_credits")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (creditError) {
      throw creditError;
    }

    const currentBalance = Number(creditData?.balance || 0);
    const newBalance = currentBalance + credits;

    // Mettre à jour ou créer le solde
    if (creditData) {
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
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("individual_credits")
        .insert({
          user_id: userId,
          balance: credits,
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        throw insertError;
      }
    }

    // Historique de l'achat RevenueCat
    const { error: purchaseError } = await supabaseAdmin
      .from("individual_credit_purchases")
      .insert({
        user_id: userId,
        revenuecat_transaction_id: transactionId,
        offer: selectedOffer,
        credits,
        amount_cents: 0,
      });

    if (purchaseError) {
      throw purchaseError;
    }

    return NextResponse.json({
      success: true,
      creditsAdded: credits,
      balance: newBalance,
    });
  } catch (error) {
    console.error("Erreur ajout crédits RevenueCat :", error);

    return NextResponse.json(
      { error: "Impossible d’ajouter les crédits." },
      { status: 500 }
    );
  }
}