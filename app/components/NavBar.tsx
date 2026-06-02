"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function NavBar() {
  const router = useRouter();
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
    <header className="sticky top-0 z-50 mb-3 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

            <div className="text-[11px] text-gray-500 max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
              {email}
            </div>
          </div>
        </div>

        <nav className="flex w-full gap-2 overflow-x-auto pb-1 sm:w-auto sm:justify-end sm:overflow-visible sm:pb-0">
          <Link href="/history" className="shrink-0 rounded-full bg-black px-3 py-2 text-sm text-white sm:px-4">
            Historique
          </Link>

          <Link href="/progress" className="shrink-0 rounded-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 sm:px-4">
            Progression
          </Link>

          <button onClick={handleLogout} className="shrink-0 rounded-full bg-red-600 px-3 py-2 text-sm text-white sm:px-4">
            Déconnexion
          </button>
        </nav>
      </div>
    </header>
  );
}