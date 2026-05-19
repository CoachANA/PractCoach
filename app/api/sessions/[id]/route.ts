import { NextResponse } from "next/server";
import { sessions } from "@/data/sessions";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, { params }: RouteProps) {
  const { id } = await params;

  const session = sessions.find((item) => item.id === id);

  if (!session) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  return NextResponse.json(session);
}