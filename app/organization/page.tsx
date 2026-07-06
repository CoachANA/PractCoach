"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const packs = [
  {
    id: "starter",
    name: "Starter",
    credits: 100,
    price: "99€",
  },
  {
    id: "pro",
    name: "Pro",
    credits: 500,
    price: "399€",
  },
  {
    id: "campus",
    name: "Campus",
    credits: 1000,
    price: "699€",
  },
];

export default function OrganizationPacksPage() {
  const router = useRouter();

  async function handleBuyPack(pack: (typeof packs)[number]) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const resCurrent = await fetch("/api/organization/current", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
      }),
    });

    const currentData = await resCurrent.json();

    if (!resCurrent.ok) {
      alert(currentData.error || "Organisation introuvable.");
      return;
    }

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  mode: "organization",
  pack: pack.id,
  userId: user.id,
  userEmail: user.email,
}),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || "Impossible de lancer le paiement.");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-900">
          Acheter des crédits PractCoach
        </h1>

        <p className="mt-3 text-gray-600">
          Choisis un pack de crédits pour ton école ou ton organisation.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-2xl font-bold">{pack.name}</h2>

              <p className="mt-6 text-4xl font-bold">{pack.credits}</p>
              <p className="mt-1 text-gray-600">crédits</p>

              <p className="mt-8 text-xl font-bold">{pack.price}</p>

              <button
                onClick={() => handleBuyPack(pack)}
                className="mt-8 w-full rounded-lg bg-black px-4 py-3 text-white"
              >
                Acheter ce pack
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}