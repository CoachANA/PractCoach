import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace("Bearer ", "");

    // Identifier l'utilisateur à partir de son token Supabase
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Utilisateur invalide ou session expirée." },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Supprimer les données liées à l'utilisateur
    const deletions = [
      supabaseAdmin
        .from("sessions")
        .delete()
        .eq("user_id", userId),

      supabaseAdmin
        .from("ai_consents")
        .delete()
        .eq("user_id", userId),

      supabaseAdmin
        .from("session_passes")
        .delete()
        .eq("user_id", userId),

      supabaseAdmin
        .from("individual_credit_purchases")
        .delete()
        .eq("user_id", userId),

      supabaseAdmin
        .from("individual_credits")
        .delete()
        .eq("user_id", userId),

      supabaseAdmin
        .from("organization_member_credits")
        .delete()
        .eq("user_id", userId),

      supabaseAdmin
        .from("organization_members")
        .delete()
        .eq("user_id", userId),
    ];

    const results = await Promise.all(deletions);

    const deletionError = results.find((result) => result.error)?.error;

    if (deletionError) {
      throw deletionError;
    }

    // Supprimer ensuite le compte Supabase Auth
    const { error: deleteUserError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      throw deleteUserError;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Erreur suppression compte :", error);

    return NextResponse.json(
      { error: "Impossible de supprimer le compte." },
      { status: 500 }
    );
  }
}