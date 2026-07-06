import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { organizationId, adminUserId } = await req.json();

    if (!organizationId || !adminUserId) {
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

    const { data: organizationCredits, error: orgError } = await supabaseAdmin
      .from("organization_credits")
      .select("total_credits")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (orgError) throw orgError;

    const { data: memberCredits, error: creditsError } = await supabaseAdmin
      .from("organization_member_credits")
      .select("total_credits")
      .eq("organization_id", organizationId);

    if (creditsError) throw creditsError;

    const { count: membersCount, error: membersError } = await supabaseAdmin
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId);

    if (membersError) throw membersError;

    const totalCredits = Number(organizationCredits?.total_credits || 0);

    const distributedCredits =
      memberCredits?.reduce(
        (sum, row) => sum + Number(row.total_credits || 0),
        0
      ) || 0;

    return NextResponse.json({
      totalCredits,
      distributedCredits,
      remainingCredits: totalCredits - distributedCredits,
      membersCount: membersCount || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur chargement stats" },
      { status: 500 }
    );
  }
}