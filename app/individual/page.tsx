"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function IndividualPage() {
  const router = useRouter();

async function handleChooseOffer(offerId: string) {
  if (offerId === "unit") {
    router.push("/scenarios");
    return;
  }

  if (offerId === "monthly") {
    alert("L’abonnement mensuel sera disponible prochainement.");
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.push("/login");
    return;
  }

  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode: "individual_pack",
      offer: offerId,
      userId: user.id,
      userEmail: user.email,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.url) {
    console.error("Erreur achat pack individuel :", data);
    alert(data.error || "Impossible de lancer le paiement.");
    return;
  }

  window.location.href = data.url;
}

const offers = [
  {
    id: "unit",
    title: "Session à l'unité",
    description:
      "Idéal pour découvrir PractCoach ou réaliser une séance ponctuelle.",
  },
  {
    id: "discovery",
    title: "Pack Découverte",
    description:
      "3 crédits pour commencer à développer vos compétences de coaching.",
  },
  {
    id: "training",
    title: "Pack Entraînement",
    description:
      "10 crédits pour progresser régulièrement et suivre votre évolution.",
  },
  {
    id: "monthly",
    title: "Abonnement mensuel",
    description:
      "Un nombre de crédits renouvelé chaque mois pour un entraînement continu.",
  },
];

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Choisissez votre formule
          </h1>

          <p className="mt-3 text-gray-600">
            Sélectionnez la formule qui correspond le mieux à votre manière de
            pratiquer avec PractCoach.
          </p>
        </div>

        <div className="grid gap-6">

          {offers.map((offer) => (
            <div
              key={offer.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                {offer.title}
              </h2>

              <p className="mt-3 text-gray-600">
                {offer.description}
              </p>

              <button
                onClick={() => handleChooseOffer(offer.id)}
                className="mt-6 rounded-xl bg-black px-5 py-3 text-white hover:bg-black transition"
              >
                Choisir cette formule
              </button>
            </div>
          ))}

        </div>
      </div>
    </main>
  );
}