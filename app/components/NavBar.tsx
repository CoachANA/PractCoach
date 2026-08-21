"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      console.log("EMAIL =", data.user?.email);
      setEmail(data.user?.email || "");
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 mb-3 bg-white/95 px-4 pb-3 pt-12 shadow-sm backdrop-blur sm:pt-3">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        
        {/* Logo + utilisateur */}
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/logo.png"
            alt="PractCoach"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-xl"
          />

          <div className="min-w-0">
            <div className="truncate text-lg font-bold text-gray-900">
              PractCoach
            </div>

            <div className="max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-gray-500">
              {email}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
          
          <Link
            href="/"
            className="rounded-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 sm:px-4"
          >
            Accueil
          </Link>

          <Link
            href="/history"
            className={`rounded-full px-3 py-2 text-sm sm:px-4 ${
              pathname.startsWith("/history")
                ? "bg-black text-white"
                : "border border-gray-300 bg-white text-gray-900"
            }`}
          >
            Historique
          </Link>

          <Link
            href="/progress"
            className={`rounded-full px-3 py-2 text-sm sm:px-4 ${
              pathname.startsWith("/progress")
                ? "bg-black text-white"
                : "border border-gray-300 bg-white text-gray-900"
            }`}
          >
            Progression
          </Link>

          <Link
            href="/account"
            className={`rounded-full px-3 py-2 text-sm sm:px-4 ${
              pathname.startsWith("/account")
                ? "bg-black text-white"
                : "border border-gray-300 bg-white text-gray-900"
            }`}
          >
            Compte
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-red-600 px-3 py-2 text-sm text-white sm:px-4"
          >
            Déconnexion
          </button>
        </nav>
      </div>
    </header>
  );
}