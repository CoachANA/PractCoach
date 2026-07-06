"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";



export default function AccessPage() {
const router = useRouter();

useEffect(() => {
  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
    }
  }

  checkUser();
}, [router]);

async function handleOrganizationAccess() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.push("/login");
    return;
  }

  const res = await fetch("/api/organization/current", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId: user.id }),
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Aucune organisation trouvée.");
    return;
  }

  if (data.role === "admin") {
    router.push("/organization/admin");
    return;
  }

  router.push("/scenarios?source=organization");
}

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Choisis ton mode d’accès
          </h1>

          <p className="mt-3 text-gray-600">
            Sélectionne le parcours adapté à ton utilisation de PractCoach.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/scenarios"
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md"
          >
            <h2 className="text-xl font-semibold text-gray-900">Accès individuel</h2>
            <p className="mt-3 text-gray-600">
              Pour les coachs qui utilisent PractCoach avec leurs propres séances.
            </p>
          </Link>

          <div
            onClick={handleOrganizationAccess}
            className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md"
            >
                 <h2 className="text-xl font-semibold text-gray-900">
                    Accès école / organisation
                </h2>

            <p className="mt-3 text-gray-600">
                Pour les élèves, coachs ou formateurs rattachés à une école de coaching.
            </p>
        </div>
        </div>
      </div>
    </main>
  );
}