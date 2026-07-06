import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { organizationId, userId, role, totalCredits, adminUserId } =
      await req.json();

    if (
      !organizationId ||
      !userId ||
      !role ||
      totalCredits === undefined ||
      !adminUserId
    ) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
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

    const newTotalCredits = role === "admin" ? 0 : Number(totalCredits);

    const { data: currentCredit, error: currentCreditError } =
      await supabaseAdmin
        .from("organization_member_credits")
        .select("id, total_credits, used_credits")
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .maybeSingle();

    if (currentCreditError) throw currentCreditError;

    const usedCredits = Number(currentCredit?.used_credits || 0);

    if (newTotalCredits < usedCredits) {
      return NextResponse.json(
        {
          error: `Impossible : ce membre a déjà utilisé ${usedCredits} crédit(s).`,
        },
        { status: 400 }
      );
    }

    const { data: organizationCredits, error: orgCreditsError } =
      await supabaseAdmin
        .from("organization_credits")
        .select("total_credits")
        .eq("organization_id", organizationId)
        .maybeSingle();

    if (orgCreditsError) throw orgCreditsError;

    const organizationTotalCredits = Number(
      organizationCredits?.total_credits || 0
    );

    const { data: allCredits, error: allCreditsError } = await supabaseAdmin
      .from("organization_member_credits")
      .select("user_id, total_credits")
      .eq("organization_id", organizationId);

    if (allCreditsError) throw allCreditsError;

    const distributedWithoutCurrent =
      allCredits?.reduce((sum, row) => {
        if (row.user_id === userId) return sum;
        return sum + Number(row.total_credits || 0);
      }, 0) || 0;

    const newDistributed = distributedWithoutCurrent + newTotalCredits;

    if (newDistributed > organizationTotalCredits) {
      return NextResponse.json(
        {
          error: `Impossible : cette modification dépasserait les ${organizationTotalCredits} crédits disponibles.`,
        },
        { status: 400 }
      );
    }

    const { error: roleError } = await supabaseAdmin
      .from("organization_members")
      .update({ role })
      .eq("organization_id", organizationId)
      .eq("user_id", userId);

    if (roleError) throw roleError;

    const { error: creditsError } = await supabaseAdmin
      .from("organization_member_credits")
      .update({ total_credits: newTotalCredits })
      .eq("organization_id", organizationId)
      .eq("user_id", userId);

    if (creditsError) throw creditsError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur modification membre" },
      { status: 500 }
    );
  }
}