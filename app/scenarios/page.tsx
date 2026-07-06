"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { scenarios } from "@/data/scenarios";
import NavBar from "@/app/components/NavBar";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ScenariosContent() {
  const [allowedScenarioIds, setAllowedScenarioIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const source = searchParams.get("source");

  useEffect(() => {
    async function loadPackScenarios() {
      console.time("load-pack");
      const { data, error } = await supabase
        .from("session_pack_items")
        .select("scenario_id, position")
        .order("position", { ascending: true });

        console.timeEnd("load-pack");

      if (error) {
        console.error("Erreur chargement pack:", error);
        setAllowedScenarioIds(scenarios.map((s) => s.id));
      } else {
         console.log("PACK ITEMS:", data);
         setAllowedScenarioIds(data.map((item) => item.scenario_id));
      }

      setLoading(false);
    }

    loadPackScenarios();
  }, []);

  const visibleScenarios = scenarios.filter((scenario) =>
    allowedScenarioIds.includes(scenario.id)
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 pb-12">
        <NavBar />
        <div className="mx-auto max-w-5xl">
          Chargement des scénarios...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 pb-12">
      <NavBar />

      <div className="mx-auto max-w-5xl">
        <h1 className="mt-0 text-3xl font-bold text-gray-900">
          Choisis un scénario
        </h1>

        <p className="mt-2 text-gray-600">
          Sélectionne un coaché IA pour commencer une séance.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {visibleScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-gray-500">{scenario.difficulty}</p>

              <h2 className="mt-2 text-xl font-semibold text-gray-900">
                {scenario.title}
              </h2>

              <p className="mt-3 text-gray-600">{scenario.summary}</p>

              <Link
                href={`/plan/${scenario.id}${source === "organization" ? "?source=organization" : ""}`}
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

export default function ScenariosPage() {
  return (
    <Suspense fallback={<main className="p-10">Chargement...</main>}>
      <ScenariosContent />
    </Suspense>
  );
}