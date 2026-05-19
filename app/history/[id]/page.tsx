"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type SessionDetail = {
  id: string;
  scenarioId: string;
  plan: string;
  createdAt: string;
  messages: {
    role: "coach" | "coachee";
    content: string;
  }[];
  feedback?: {
    overallScore: number;
    questioning: number;
    exploration: number;
    posture: number;
    strengths: string[] | string;
    improvements: string[] | string;
    nextStep: string;
  };
};

export default function HistoryDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [session, setSession] = useState<SessionDetail | null>(null);

  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then((res) => res.json())
      .then((data) => setSession(data));
  }, [id]);

  if (!session) {
    return (
      <main className="min-h-screen bg-white px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <p className="text-gray-500">Chargement de la séance...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900">Détail de la séance</h1>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <p>
            <strong>Scénario :</strong> {session.scenarioId}
          </p>
          <p className="mt-2">
            <strong>Plan :</strong>{" "}
            {session.plan.charAt(0).toUpperCase() + session.plan.slice(1)}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {new Date(session.createdAt).toLocaleString()}
          </p>
        </div>

        <h2 className="mt-8 text-2xl font-bold text-gray-900">Transcription</h2>

        <div className="mt-8 space-y-4">
          {session.messages.map((message, index) => (
            <div
              key={index}
              className={`rounded-xl p-4 ${
                message.role === "coach"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="text-sm font-semibold">
                {message.role === "coach" ? "Coach" : "Coaché IA"}
              </p>
              <p className="mt-1">{message.content}</p>
            </div>
          ))}
        </div>

        {session.feedback && (
  <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
    <h2 className="text-2xl font-bold mb-4">
      Feedback de coaching
    </h2>

    <div className="space-y-4">
      <div>
        <p className="font-semibold text-green-600">
          Points forts :
        </p>
        <p>{session.feedback.strengths}</p>
      </div>

      <div>
        <p className="font-semibold text-orange-500">
          Axes d'amélioration :
        </p>
        <p>{session.feedback.improvements}</p>
      </div>

      <div>
        <p className="font-semibold text-blue-600">
          Prochaine étape :
        </p>
        <p>{session.feedback.nextStep}</p>
      </div>

            <div className="mb-6 grid gap-4 md:grid-cols-4">
  <div className="rounded-xl bg-gray-50 p-4">
    <p className="text-sm text-gray-500">Score global</p>
    <p className="mt-1 text-2xl font-bold text-gray-900">
      {session.feedback.overallScore}/100
    </p>
  </div>

  <div className="rounded-xl bg-gray-50 p-4">
    <p className="text-sm text-gray-500">Questions</p>
    <p className="mt-1 text-2xl font-bold text-gray-900">
      {session.feedback.questioning}/100
    </p>
  </div>

  <div className="rounded-xl bg-gray-50 p-4">
    <p className="text-sm text-gray-500">Exploration</p>
    <p className="mt-1 text-2xl font-bold text-gray-900">
      {session.feedback.exploration}/100
    </p>
  </div>

  <div className="rounded-xl bg-gray-50 p-4">
    <p className="text-sm text-gray-500">Posture</p>
    <p className="mt-1 text-2xl font-bold text-gray-900">
      {session.feedback.posture}/100
    </p>
  </div>
</div>

    </div>
  </div>

)}
      </div>
    </main>
  );
}