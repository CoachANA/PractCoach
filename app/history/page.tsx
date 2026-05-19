"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { supabase } from "@/lib/supabase";

import NavBar from "@/app/components/NavBar";

type SessionItem = {
  id: string;
  scenario_id: string;
  plan: string;
  created_at: string;
  score: number | null;
  messages: {
    role: "coach" | "coachee";
    content: string;
  }[];
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);

  useEffect(() => {
  async function loadSessions() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSessions([]);
      return;
    }

    const res = await fetch(`/api/sessions?userId=${user.id}`);
    const data = await res.json();

    setSessions(data);
  }

  loadSessions();
}, []);

  return (
    <main className="min-h-screen bg-white px-6 py-20">
      <NavBar />
      <div className="flex items-center gap-3">
 
  <a
    href="/progress"
    className="rounded-xl bg-black px-4 py-2 text-sm text-white"
  >
    Voir ma progression
  </a>
  
  <a
  href="/"
  className="rounded-xl bg-green-600 px-4 py-2 text-sm text-white"
>
  Nouvelle séance
</a>

</div>
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900">
          Historique des séances
        </h1>

        <p className="mt-2 text-gray-600">
          Retrouve ici les séances terminées.
        </p>

        {sessions.length === 0 ? (
          <p className="mt-8 text-gray-500">Aucune séance pour le moment.</p>
        ) : (
          <div className="mt-8 space-y-4">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/history/${session.id}`}
                className="block rounded-2xl border border-gray-200 bg-gray-50 p-5 transition hover:bg-gray-100"
                >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-black px-3 py-1 text-sm text-white">
                    {session.plan.charAt(0).toUpperCase() + session.plan.slice(1)}
                  </span>

                  <span className="text-sm text-gray-500">
                    {new Date(session.created_at).toLocaleString()}
                  </span>
                </div>

                <h2 className="mt-3 text-xl font-semibold text-gray-900">
                  {session.scenario_id}
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                  {session.messages.length} messages enregistrés
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  {session.messages.length} messages enregistrés · Score : {session.score ?? "N/A"}/100
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}