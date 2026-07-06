"use client";

import Link from "next/link";
import { scenarios } from "@/data/scenarios";

export default function PackFondamentauxPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-900">
          Pack École - Fondamentaux du coaching
        </h1>

        <p className="mt-3 text-gray-600">
          10 scénarios pour entraîner les élèves coachs.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="rounded-2xl border bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">{scenario.difficulty}</p>
              <h2 className="mt-2 text-xl font-semibold">{scenario.title}</h2>
              <p className="mt-3 text-gray-600">{scenario.summary}</p>

              <Link
                href={`/plan/${scenario.id}?source=organization`}
                className="mt-6 inline-block rounded-xl bg-black px-4 py-2 text-white"
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