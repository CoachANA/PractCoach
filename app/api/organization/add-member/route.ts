import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { email, role, credits, organizationId, adminUserId } = await req.json();

    if (!email || !role || credits === undefined || !organizationId || !adminUserId) {
      return NextResponse.json(
        { error: "Champs manquants" },
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
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    const { data: usersData, error: usersError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (usersError) throw usersError;

    const targetUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!targetUser) {
      return NextResponse.json(
        {
          error:
            "Cet utilisateur doit d’abord se connecter une fois à PractCoach.",
        },
        { status: 404 }
      );
    }

    const requestedCredits = role === "admin" ? 0 : Number(credits);

    const { data: creditsRows, error: creditsRowsError } = await supabaseAdmin
      .from("organization_member_credits")
      .select("total_credits")
      .eq("organization_id", organizationId);

    if (creditsRowsError) throw creditsRowsError;

    const alreadyDistributed =
      creditsRows?.reduce(
        (sum, row) => sum + Number(row.total_credits || 0),
        0
      ) || 0;

    const { data: organizationCredits, error: organizationCreditsError } =
      await supabaseAdmin
        .from("organization_credits")
        .select("total_credits")
        .eq("organization_id", organizationId)
        .maybeSingle();

    if (organizationCreditsError) throw organizationCreditsError;

    const organizationTotalCredits = Number(
      organizationCredits?.total_credits || 0
    );

    const remainingCredits = organizationTotalCredits - alreadyDistributed;

    if (requestedCredits > remainingCredits) {
      return NextResponse.json(
        {
          error: `Il ne reste que ${remainingCredits} crédit(s) disponibles.`,
        },
        { status: 400 }
      );
    }

    const { error: memberError } = await supabaseAdmin
      .from("organization_members")
      .insert({
        organization_id: organizationId,
        user_id: targetUser.id,
        role,
      });

    if (memberError) {
      if (memberError.code === "23505") {
        return NextResponse.json(
          { error: "Ce membre existe déjà dans cette organisation." },
          { status: 409 }
        );
      }

      throw memberError;
    }

    const { error: creditsError } = await supabaseAdmin
      .from("organization_member_credits")
      .insert({
        organization_id: organizationId,
        user_id: targetUser.id,
        total_credits: requestedCredits,
        used_credits: 0,
      });

    if (creditsError) throw creditsError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("ADD MEMBER ERROR:", error);

    return NextResponse.json(
      { error: error?.message || "Erreur ajout membre" },
      { status: 500 }
    );
  }
}