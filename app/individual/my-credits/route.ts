import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId est requis" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("individual_credits")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      balance: Number(data?.balance || 0),
    });
  } catch (error) {
    console.error("Erreur lecture crédits individuels :", error);

    return NextResponse.json(
      { error: "Impossible de récupérer les crédits individuels" },
      { status: 500 }
    );
  }
}