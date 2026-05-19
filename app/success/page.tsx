"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const scenarioId = searchParams.get("scenarioId");
    const plan = searchParams.get("plan");

    if (!scenarioId || !plan) {
      router.push("/scenarios");
      return;
    }

    router.push(`/session/${scenarioId}?plan=${plan}`);
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="rounded-2xl border border-gray-200 p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Paiement validé</h1>
        <p className="mt-3 text-gray-600">Préparation de ta séance...</p>
      </div>
    </main>
  );
}