import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "Aucune organisation admin trouvée pour cet utilisateur." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      organizationId: data.organization_id,
      role: data.role,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur organisation courante" },
      { status: 500 }
    );
  }
}