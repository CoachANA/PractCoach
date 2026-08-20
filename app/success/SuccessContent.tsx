"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [error, setError] = useState("");

  useEffect(() => {
    async function verifyPayment() {
      const sessionId = searchParams.get("session_id");

      if (!sessionId) {
        setError("Session de paiement introuvable.");
        return;
      }

      try {
        const response = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.error ||
              "Impossible de vérifier le paiement."
          );
          return;
        }

        router.replace(
          `/session/${data.scenarioId}?plan=${data.plan}&source=individual`
        );
      } catch (error) {
        console.error(
          "Erreur vérification paiement :",
          error
        );

        setError(
          "Une erreur est survenue lors de la validation du paiement."
        );
      }
    }

    verifyPayment();
  }, [router, searchParams]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="rounded-2xl border border-red-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Erreur de validation
          </h1>

          <p className="mt-3 text-gray-600">
            {error}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="rounded-2xl border border-gray-200 p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Paiement validé
        </h1>

        <p className="mt-3 text-gray-600">
          Préparation de ta séance...
        </p>
      </div>
    </main>
  );
}