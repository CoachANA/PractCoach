"use client";

import Link from "next/link";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { scenarios } from "@/data/scenarios";
import NavBar from "@/app/components/NavBar";

export default function ScenariosPage() {

useEffect(() => {
  supabase.auth.getUser().then(({ data }) => {
    console.log("USER:", data.user);
  });
}, []);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <NavBar />
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-900">
          Choisis un scénario
        </h1>
        <p className="mt-2 text-gray-600">
          Sélectionne un coaché IA pour commencer une séance.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-gray-500">
                {scenario.difficulty}
              </p>

              <h2 className="mt-2 text-xl font-semibold text-gray-900">
                {scenario.title}
              </h2>

              <p className="mt-3 text-gray-600">
                {scenario.summary}
              </p>

              <Link
                href={`/plan/${scenario.id}`}
                className="mt-6 inline-block rounded-xl bg-black px-4 py-2 text-white hover:opacity-90"
              >
                Commencer
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}