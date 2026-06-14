"use client";

import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { scenarios } from "@/data/scenarios";
import Image from "next/image";

const plans = [
  {
    id: "argent",
    title: "Argent",
    price: "3€",
    description: "Expérience audio : conversation vocale, IA, feedback.",
    features: ["15 min de séance", "Audio + transcription", "Feedback de fin de séance"],
  },
  {
    id: "silver",
    title: "Silver",
    price: "7€",
    description: "Expérience immersive : audio + avatar sur moments clés.",
    features: ["15 min de séance", "Audio + transcription", "Avatar partiel", "Feedback de fin de séance"],
  },
  {
    id: "gold",
    title: "Gold",
    price: "19€",
    description: "Expérience premium : avatar complet pendant la séance.",
    features: ["15 min de séance", "Audio + transcription", "Avatar complet", "Feedback de fin de séance"],
  },
];

export default function PlanPage() {
  const router = useRouter();
  const params = useParams();
  const scenarioId = params.scenarioId as string;

  const scenario = scenarios.find((item) => item.id === scenarioId);

  if (!scenario) {
    return <p className="p-10">Scénario introuvable.</p>;
  }

  async function handleChoosePlan(plan: "argent" | "silver" | "gold") {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.push("/login");
    return;
  }

  const isIOS =
    typeof window !== "undefined" &&
    /iPhone|iPad|iPod/.test(window.navigator.userAgent);

  if (isIOS) {
    router.push(`/session/${scenarioId}?plan=${plan}`);
    return;
  }

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan,
      userId: user.id,
      userEmail: user.email,
      scenarioId,
    }),
  });

  const data = await res.json();

  if (data.url) {
    window.location.href = data.url;
  } else {
    console.error("Erreur checkout :", data);
    alert("Impossible de lancer le paiement.");
  }
}

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">

         <div className="fixed left-6 top-6 z-50 flex items-center gap-3">
             
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="PractCoach"
            width={42}
            height={42}
            className="rounded-xl"
          />
      
          <span className="font-bold text-xl text-gray-900">
            PractCoach
          </span>
        </div>
            </div>
      <div className="mx-auto max-w-6xl">
        

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          {scenario.title}
        </h1>

        <p className="mt-3 text-gray-600">{scenario.summary}</p>

        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-gray-900">
            Choisis ton expérience
          </h2>
          <p className="mt-2 text-gray-600">
            Sélectionne le niveau qui correspond à ton budget et à l’expérience souhaitée.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    {plan.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {plan.description}
                  </p>
                </div>

                <span className="rounded-full bg-black px-3 py-1 text-sm text-white">
                  {plan.price}
                </span>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-gray-700">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>

              <button
                onClick={() =>
                  handleChoosePlan(plan.id as "argent" | "silver" | "gold")
                }
                className="mt-8 w-full rounded-xl bg-black px-4 py-3 text-center text-white hover:opacity-90"
              >
                Choisir {plan.title}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}