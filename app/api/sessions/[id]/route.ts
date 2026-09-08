import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: RouteProps) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Session introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: data.id,
      scenarioId: data.scenario_id,
      plan: data.plan,
      createdAt: data.created_at,
      messages: data.messages ?? [],
      feedback: data.feedback ?? undefined,
    });
  } catch (error) {
    console.error("Erreur GET session détail :", error);

    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}