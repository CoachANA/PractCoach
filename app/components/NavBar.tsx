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
    setEmail(data.user?.email || "");
  });
}, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="fixed right-6 top-6 z-50 flex gap-3">

      <div className="fixed left-6 top-6 z-50 flex items-center gap-3">
       
  <div className="flex items-center gap-2">
    <Image
      src="/logo.png"
      alt="PractCoach"
      width={42}
      height={42}
      className="rounded-xl"
    />

    <span className="font-bold text-xl text-gray-900">
      PractCoach
    </span>
  </div>
      </div>
        <span className="text-sm text-gray-600">{email}</span>
      <Link
        href="/history"
        className="rounded-full bg-black px-4 py-2 text-sm text-white"
      >
        Historique
      </Link>

      <Link
        href="/progress"
        className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900"
      >
        Progression
      </Link>

      <button
        onClick={handleLogout}
        className="rounded-full bg-red-600 px-4 py-2 text-sm text-white"
      >
        Déconnexion
      </button>
    </div>
  );
}