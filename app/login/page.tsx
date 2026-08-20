"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Capacitor } from "@capacitor/core";

const PASSWORD_LOGIN_EMAILS = [
  "apple-review@practcoach.com",
  "apple-delete-test@practcoach.com",
];

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const isPasswordLoginAccount =
  PASSWORD_LOGIN_EMAILS.includes(normalizedEmail);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!normalizedEmail) {
      setMessage("Merci de renseigner ton adresse e-mail.");
      return;
    }

    setIsLoading(true);

    try {
      /*
       * Parcours réservé au compte de démonstration Apple :
       * connexion directe avec e-mail et mot de passe.
       */
      if (isPasswordLoginAccount) {
        if (!password) {
          setMessage("Merci de renseigner le mot de passe.");
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          console.error("Erreur de connexion Apple Review :", error);
          setMessage("Adresse e-mail ou mot de passe incorrect.");
          return;
        }

        router.replace("/access");
        return;
      }

      /*
       * Parcours normal pour tous les utilisateurs :
       * authentification par Magic Link.
       */
      const emailRedirectTo = Capacitor.isNativePlatform()
        ? "https://www.practcoach.com/login-callback"
        : `${window.location.origin}/access`;

      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo,
        },
      });

      if (error) {
        console.error("Erreur lors de l'envoi du Magic Link :", error);
        setMessage(error.message);
        return;
      }

      setMessage("Lien envoyé. Vérifie ta boîte mail.");
    } catch (error) {
      console.error("Erreur inattendue lors de la connexion :", error);
      setMessage("Une erreur est survenue. Merci de réessayer.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    setMessage("");

    if (
  !PASSWORD_LOGIN_EMAILS.includes(
    value.trim().toLowerCase()
  )
) {
  setPassword("");
}
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>

        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Ton email"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          className="mt-6 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-black"
        />

        {isPasswordLoginAccount && (
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setMessage("");
            }}
            className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-black"
          />
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 w-full rounded-xl bg-black px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading
            ? "Connexion en cours..."
            : isPasswordLoginAccount
              ? "Se connecter"
              : "Recevoir mon lien de connexion"}
        </button>

        {message && (
          <p
            role="status"
            className="mt-4 text-sm text-gray-600"
          >
            {message}
          </p>
        )}
      </form>
    </main>
  );
}