import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;

export async function POST(req: Request) {
  try {
    // 1. Vérifier que l'appel vient bien de RevenueCat
    const authorization = req.headers.get("authorization");

    if (!webhookSecret || authorization !== webhookSecret) {
      console.error("RevenueCat webhook : autorisation invalide");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Lire l'événement RevenueCat
    const body = await req.json();
    const event = body?.event;

    if (!event) {
      return NextResponse.json(
        { error: "Événement RevenueCat manquant" },
        { status: 400 }
      );
    }

    const eventId = event.id;
    const eventType = event.type;
    const productId = event.product_id;
    const userId = event.app_user_id;

    console.log("RevenueCat event reçu :", {
      eventId,
      eventType,
      productId,
      userId,
    });

    // 3. Nous ne traitons que les nouveaux achats
    if (eventType !== "NON_RENEWING_PURCHASE") {
      return NextResponse.json({ received: true });
    }

    // 4. Pour le moment, seul Starter est vendu sur mobile
    if (productId !== "organization_starter") {
      return NextResponse.json({ received: true });
    }

    const creditsToAdd = 100;

    if (!eventId || !userId) {
      return NextResponse.json(
        { error: "Données RevenueCat incomplètes" },
        { status: 400 }
      );
    }

    // 5. Vérifier si cet événement a déjà été traité
    const { data: existingPurchase, error: existingError } =
      await supabaseAdmin
        .from("organization_credit_purchases")
        .select("id")
        .eq("revenuecat_event_id", eventId)
        .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingPurchase) {
      console.log("Événement RevenueCat déjà traité :", eventId);
      return NextResponse.json({
        received: true,
        alreadyProcessed: true,
      });
    }

    // 6. Trouver l'organisation administrée par l'acheteur
    const { data: member, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (memberError) {
      throw memberError;
    }

    if (!member) {
      console.error(
        "Aucune organisation administrée par l'utilisateur :",
        userId
      );

      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    // 7. Lire le solde actuel de l'organisation
    const { data: organizationCredits, error: creditsError } =
      await supabaseAdmin
        .from("organization_credits")
        .select("total_credits")
        .eq("organization_id", member.organization_id)
        .maybeSingle();

    if (creditsError) {
      throw creditsError;
    }

    if (!organizationCredits) {
      return NextResponse.json(
        { error: "Ligne organization_credits introuvable" },
        { status: 404 }
      );
    }

    const currentTotal = Number(
      organizationCredits.total_credits || 0
    );

    const newTotal = currentTotal + creditsToAdd;

    // 8. Ajouter les 100 crédits
    const { error: updateError } = await supabaseAdmin
      .from("organization_credits")
      .update({
        total_credits: newTotal,
      })
      .eq("organization_id", member.organization_id);

    if (updateError) {
      throw updateError;
    }

    // 9. Enregistrer l'achat pour empêcher un double traitement
    const { error: purchaseError } = await supabaseAdmin
      .from("organization_credit_purchases")
      .insert({
        organization_id: member.organization_id,
        user_id: userId,
        revenuecat_event_id: eventId,
        product_id: productId,
        credits: creditsToAdd,
      });

    if (purchaseError) {
      throw purchaseError;
    }

    console.log("Crédits organisation RevenueCat ajoutés ✅", {
      organizationId: member.organization_id,
      added: creditsToAdd,
      total: newTotal,
    });

    return NextResponse.json({
      received: true,
      creditsAdded: creditsToAdd,
    });
  } catch (error) {
    console.error("Erreur webhook RevenueCat :", error);

    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}