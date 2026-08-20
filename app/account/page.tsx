"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AccountPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");

  async function handleDeleteAccount() {
    try {
      setLoading(true);
      setError("");

      // Récupérer la session Supabase de l'utilisateur connecté
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setError(
          "Votre session a expiré. Veuillez vous reconnecter."
        );
        return;
      }

      // Appeler notre API de suppression de compte
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Impossible de supprimer votre compte."
        );
      }

      // Déconnexion locale après suppression
      await supabase.auth.signOut();

      // Retour vers la page de connexion
      router.replace("/login");
    } catch (err) {
      console.error("Erreur suppression compte :", err);

      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de la suppression du compte."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm">

        <h1 className="text-2xl font-bold text-gray-900">
          Mon compte
        </h1>

        <p className="mt-2 text-gray-600">
          Gérez les paramètres de votre compte PractCoach.
        </p>

        <div className="mt-8 border-t pt-6">

          <h2 className="text-lg font-semibold text-red-600">
            Supprimer mon compte
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            La suppression de votre compte est définitive.
            Votre compte PractCoach ainsi que les données associées
            seront supprimés.
          </p>

          {!showConfirmation ? (
            <button
              type="button"
              onClick={() => setShowConfirmation(true)}
              className="mt-5 rounded-lg bg-red-600 px-4 py-3 font-medium text-white"
            >
              Supprimer mon compte
            </button>
          ) : (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">

              <p className="font-medium text-gray-900">
                Confirmez-vous la suppression définitive de votre compte ?
              </p>

              <p className="mt-2 text-sm text-gray-600">
                Cette action est irréversible.
              </p>

              {error && (
                <p className="mt-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="mt-4 flex gap-3">

                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  disabled={loading}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white disabled:opacity-50"
                >
                  {loading
                    ? "Suppression..."
                    : "Oui, supprimer définitivement"}
                </button>

              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}