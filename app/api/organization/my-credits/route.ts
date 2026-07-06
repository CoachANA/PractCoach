import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 });
    }

    const { data: credit, error } = await supabaseAdmin
      .from("organization_member_credits")
      .select("organization_id, total_credits, used_credits")
      .eq("user_id", userId)
      .single();

    if (error || !credit) {
      return NextResponse.json(
        { error: "Aucun crédit trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      organizationId: credit.organization_id,
      totalCredits: credit.total_credits,
      usedCredits: credit.used_credits,
      remainingCredits: credit.total_credits - credit.used_credits,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur crédits" },
      { status: 500 }
    );
  }
}