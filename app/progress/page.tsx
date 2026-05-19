"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "@/app/components/NavBar";
import { supabase } from "@/lib/supabase";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type SessionItem = {
  id: string;
  scenario_id: string;
  plan: string;
  score: number | null;
  created_at: string;
  feedback?: {
    overallScore?: number;
    questioning?: number;
    exploration?: number;
    posture?: number;
  };
};

export default function ProgressPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSessions() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      const res = await fetch(`/api/sessions?userId=${user.id}`);
      const data = await res.json();

      setSessions(data || []);
      setIsLoading(false);
    }

    loadSessions();
  }, []);

  const sessionsWithFeedback = useMemo(() => {
    return sessions.filter((s) => s.feedback || typeof s.score === "number");
  }, [sessions]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white px-6 py-12">
        <NavBar />
        <div className="mx-auto max-w-4xl">
          <p className="text-gray-500">Chargement de la progression...</p>
        </div>
      </main>
    );
  }

  if (sessionsWithFeedback.length === 0) {
    return (
      <main className="min-h-screen bg-white px-6 py-12">
        <NavBar />
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900">Ta progression</h1>
          <p className="mt-4 text-gray-500">Aucune donnée pour le moment.</p>
        </div>
      </main>
    );
  }

  const totalSessions = sessionsWithFeedback.length;

  const averages = sessionsWithFeedback.reduce(
    (acc, session) => {
      acc.overall += session.feedback?.overallScore ?? session.score ?? 0;
      acc.questioning += session.feedback?.questioning ?? 0;
      acc.exploration += session.feedback?.exploration ?? 0;
      acc.posture += session.feedback?.posture ?? 0;
      return acc;
    },
    { overall: 0, questioning: 0, exploration: 0, posture: 0 }
  );

  const avg = {
    overall: Math.round(averages.overall / totalSessions),
    questioning: Math.round(averages.questioning / totalSessions),
    exploration: Math.round(averages.exploration / totalSessions),
    posture: Math.round(averages.posture / totalSessions),
  };

  const chartData = [...sessionsWithFeedback]
    .reverse()
    .map((session, index) => ({
      name: index + 1,
      score: session.feedback?.overallScore ?? session.score ?? 0,
    }));

  const last = chartData.at(-1)?.score ?? 0;
  const previous = chartData.at(-2)?.score ?? 0;

  let trend = "➡️ Stable";
  if (totalSessions > 1) {
    if (last > previous) trend = "📈 En hausse";
    if (last < previous) trend = "📉 En baisse";
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <NavBar />

      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900">Ta progression</h1>
        <p className="mt-2 text-gray-600">
          Suis l’évolution de ta posture de coaching au fil des séances.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card title="Score global" value={avg.overall} />
          <Card title="Questions" value={avg.questioning} />
          <Card title="Exploration" value={avg.exploration} />
          <Card title="Posture" value={avg.posture} />
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <p>
            <strong>Nombre de séances :</strong> {totalSessions}
          </p>
          <p className="mt-2">
            <strong>Dernière séance :</strong>{" "}
            {sessionsWithFeedback[0]?.scenario_id}
          </p>
          <p className="mt-2">
            <strong>Tendance :</strong> {trend}
          </p>
        </div>

        <div className="mt-10 rounded-2xl border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Évolution du score</h2>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl bg-gray-100 p-4 text-center">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}/100</p>
    </div>
  );
}