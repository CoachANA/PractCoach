import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const id = searchParams.get("id");

    // 👉 cas détail
    if (id) {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }

    // 👉 cas liste
    if (!userId) {
      return NextResponse.json([]);
    }

    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scenarioId, messages, plan, feedback, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Utilisateur non connecté" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("sessions")
      .insert([
        {
          user_id: userId,
          scenario_id: scenarioId,
          plan,
          messages,
          feedback,
          score: feedback?.overallScore ?? null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Erreur Supabase sessions :", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, session: data });
  } catch (error) {
    console.error("Erreur POST sessions :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}