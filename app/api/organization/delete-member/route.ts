import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { organizationId, userId, adminUserId } = await req.json();

    if (!organizationId || !userId || !adminUserId) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    if (userId === adminUserId) {
      return NextResponse.json(
        { error: "Tu ne peux pas te supprimer toi-même de l’organisation." },
        { status: 400 }
      );
    }

    const { data: adminMember } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", adminUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminMember) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { data: credit, error: creditError } = await supabaseAdmin
      .from("organization_member_credits")
      .select("used_credits")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (creditError) throw creditError;

    if (Number(credit?.used_credits || 0) > 0) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer ce membre : il a déjà consommé des crédits.",
        },
        { status: 400 }
      );
    }

    const { error: creditsDeleteError } = await supabaseAdmin
      .from("organization_member_credits")
      .delete()
      .eq("organization_id", organizationId)
      .eq("user_id", userId);

    if (creditsDeleteError) throw creditsDeleteError;

    const { error: memberDeleteError } = await supabaseAdmin
      .from("organization_members")
      .delete()
      .eq("organization_id", organizationId)
      .eq("user_id", userId);

    if (memberDeleteError) throw memberDeleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur suppression membre" },
      { status: 500 }
    );
  }
}