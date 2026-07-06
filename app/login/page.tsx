"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "http://localhost:3000/access",
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Lien envoyé. Vérifie ta boîte mail.");
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
          placeholder="Ton email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-6 w-full rounded-xl border border-gray-300 px-4 py-3"
        />

        <button className="mt-4 w-full rounded-xl bg-black px-4 py-3 text-white">
          Recevoir mon lien de connexion
        </button>

        {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
      </form>
    </main>
  );
}