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

    const { data: members, error } = await supabaseAdmin
      .from("organization_members")
      .select("user_id, role, created_at")
      .eq("organization_id", organizationId);

    if (error) throw error;

    const { data: credits, error: creditsError } = await supabaseAdmin
      .from("organization_member_credits")
      .select("user_id, total_credits, used_credits")
      .eq("organization_id", organizationId);

    if (creditsError) throw creditsError;

    const { data: usersData, error: usersError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (usersError) throw usersError;

    const result = members.map((member) => {
      const user = usersData.users.find((u) => u.id === member.user_id);
      const credit = credits.find((c) => c.user_id === member.user_id);

      return {
        user_id: member.user_id,
        email: user?.email || "Email inconnu",
        role: member.role,
        total_credits: credit?.total_credits || 0,
        used_credits: credit?.used_credits || 0,
      };
    });

    return NextResponse.json({ members: result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur chargement membres" },
      { status: 500 }
    );
  }
}