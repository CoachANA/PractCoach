"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { scenarios } from "@/data/scenarios";
import NavBar from "@/app/components/NavBar";

const AI_CONSENT_VERSION = "1.0";

function ScenariosContent() {
  const router = useRouter();

  const [allowedScenarioIds, setAllowedScenarioIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAiConsent, setShowAiConsent] = useState(false);
  const [pendingScenarioUrl, setPendingScenarioUrl] = useState<string | null>(
    null
  );

  const [checkingConsent, setCheckingConsent] = useState(false);
  const [savingConsent, setSavingConsent] = useState(false);
  const [consentError, setConsentError] = useState("");

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

  async function handleStartScenario(url: string) {
    try {
      setCheckingConsent(true);
      setConsentError("");

      // Récupérer l'utilisateur connecté
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      // Vérifier si cet utilisateur a déjà accepté
      // la version actuelle du consentement
      const { data: existingConsents, error: consentCheckError } =
        await supabase
          .from("ai_consents")
          .select("id")
          .eq("user_id", user.id)
          .eq("consent_version", AI_CONSENT_VERSION)
          .is("revoked_at", null)
          .limit(1);

      if (consentCheckError) {
        console.error(
          "Erreur vérification consentement IA:",
          consentCheckError
        );

        setConsentError(
          "Impossible de vérifier votre consentement pour le moment."
        );

        setPendingScenarioUrl(url);
        setShowAiConsent(true);
        return;
      }

      // Consentement déjà donné :
      // on peut continuer vers le scénario
      if (existingConsents && existingConsents.length > 0) {
        router.push(url);
        return;
      }

      // Pas encore de consentement :
      // afficher la fenêtre
      setPendingScenarioUrl(url);
      setShowAiConsent(true);
    } catch (error) {
      console.error("Erreur consentement IA:", error);

      setConsentError(
        "Une erreur est survenue lors de la vérification du consentement."
      );

      setPendingScenarioUrl(url);
      setShowAiConsent(true);
    } finally {
      setCheckingConsent(false);
    }
  }

  async function handleAcceptAiConsent() {
    try {
      setSavingConsent(true);
      setConsentError("");

      // Identifier l'utilisateur connecté
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setConsentError(
          "Votre session a expiré. Veuillez vous reconnecter."
        );
        return;
      }

      // Vérifier une dernière fois qu'un consentement actif
      // n'existe pas déjà
      const { data: existingConsents, error: checkError } = await supabase
        .from("ai_consents")
        .select("id")
        .eq("user_id", user.id)
        .eq("consent_version", AI_CONSENT_VERSION)
        .is("revoked_at", null)
        .limit(1);

      if (checkError) {
        console.error(
          "Erreur vérification consentement avant insertion:",
          checkError
        );

        setConsentError(
          "Impossible d'enregistrer votre consentement."
        );
        return;
      }

      // Insérer le consentement s'il n'existe pas encore
      if (!existingConsents || existingConsents.length === 0) {
        const { error: insertError } = await supabase
          .from("ai_consents")
          .insert({
            user_id: user.id,
            consent_version: AI_CONSENT_VERSION,
          });

        if (insertError) {
          console.error(
            "Erreur enregistrement consentement IA:",
            insertError
          );

          setConsentError(
            "Impossible d'enregistrer votre consentement. Veuillez réessayer."
          );
          return;
        }
      }

      // Consentement enregistré :
      // fermer la fenêtre puis continuer vers le scénario
      setShowAiConsent(false);

      if (pendingScenarioUrl) {
        router.push(pendingScenarioUrl);
      }
    } catch (error) {
      console.error("Erreur enregistrement consentement IA:", error);

      setConsentError(
        "Une erreur est survenue lors de l'enregistrement du consentement."
      );
    } finally {
      setSavingConsent(false);
    }
  }

  function handleRefuseAiConsent() {
    setShowAiConsent(false);
    setPendingScenarioUrl(null);
    setConsentError("");
  }

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
          {visibleScenarios.map((scenario) => {
            const scenarioUrl = `/plan/${scenario.id}${
              source === "organization" ? "?source=organization" : ""
            }`;

            return (
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

                <button
                  type="button"
                  onClick={() => handleStartScenario(scenarioUrl)}
                  disabled={checkingConsent}
                  className="mt-6 inline-block rounded-xl bg-black px-4 py-2 text-white hover:opacity-90 disabled:opacity-50"
                >
                  {checkingConsent
                    ? "Vérification..."
                    : "Commencer"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {showAiConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">
                Utilisation de services d’intelligence artificielle
            </h2>

            <p className="mt-4 text-sm text-gray-700">
              PractCoach est un outil d’entraînement au coaching : vous jouez le rôle
              du coach et l’intelligence artificielle joue le rôle du coaché.
            </p>

            <p className="mt-3 text-sm text-gray-700">
              Pendant une simulation, votre enregistrement vocal peut être transmis à
              OpenAI afin d’être transcrit. Vos interventions en tant que coach ainsi
              que l’historique de la simulation peuvent également être transmis à OpenAI
              afin de générer les réponses du coaché simulé et leur version audio.
            </p>

            <p className="mt-3 text-sm text-gray-700">
              Si vous choisissez l’expérience Gold, les données nécessaires à la
              conversation peuvent également être transmises à D-ID afin de fournir
              l’avatar conversationnel en direct.
            </p>

            <p className="mt-3 text-sm font-medium text-gray-900">
              En acceptant, vous autorisez PractCoach à transmettre ces données à
              OpenAI et, lorsque l’expérience Gold est utilisée, à D-ID, afin de fournir
              les fonctionnalités de la séance.
            </p>

            {consentError && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {consentError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleRefuseAiConsent}
                disabled={savingConsent}
                className="rounded-xl border border-gray-300 px-4 py-2 text-gray-700 disabled:opacity-50"
              >
                Refuser
              </button>

              <button
                type="button"
                onClick={handleAcceptAiConsent}
                disabled={savingConsent}
                className="rounded-xl bg-black px-4 py-2 font-medium text-white disabled:opacity-50"
              >
                {savingConsent
                  ? "Enregistrement..."
                  : "J’accepte"}
              </button>
            </div>
          </div>
        </div>
      )}
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