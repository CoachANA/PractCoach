"use client";

import { useState } from "react";

const APP_CALLBACK_URL = "com.practcoach.app://login-callback";

export default function LoginCallbackPage() {
  const [message, setMessage] = useState(
     "Appuie sur le bouton ci-dessous pour ouvrir PractCoach.",
  );

  function openPractCoach() {
    /*
     * Conserve les paramètres Supabase présents dans l’URL :
     * - le paramètre ?code=... dans le parcours PKCE ;
     * - ou les jetons présents après # dans le parcours implicite.
     */
    const callbackUrl =
      `${APP_CALLBACK_URL}${window.location.search}${window.location.hash}`;

    window.location.href = callbackUrl;

    window.setTimeout(() => {
      setMessage(
        "PractCoach ne s’est pas ouvert automatiquement. " +
          "Vérifie que l’application est installée, puis appuie sur le bouton.",
      );
    }, 1500);
  }

 

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Connexion à PractCoach
        </h1>

        <p
          role="status"
          className="mt-4 text-sm leading-6 text-gray-600"
        >
          {message}
        </p>

        <button
          type="button"
          onClick={openPractCoach}
          className="mt-6 w-full rounded-xl bg-black px-4 py-3 text-white"
        >
          Ouvrir PractCoach
        </button>

        <a
          href="/login"
          className="mt-4 inline-block text-sm text-gray-600 underline"
        >
          Retour à la page de connexion
        </a>
      </section>
    </main>
  );
}