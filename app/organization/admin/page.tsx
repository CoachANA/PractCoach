"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";


export default function OrganizationAdminPage() {

const [email, setEmail] = useState("");
const [role, setRole] = useState("student");
const [credits, setCredits] = useState("");
const [message, setMessage] = useState("");
const [members, setMembers] = useState<any[]>([]);



const [totalCredits, setTotalCredits] = useState(0);

const [distributedCredits, setDistributedCredits] = useState(0);

const remainingCredits = totalCredits - distributedCredits;

const [organizationId, setOrganizationId] = useState<string | null>(null);
const [loadingOrganization, setLoadingOrganization] = useState(true);
const [membersCount, setMembersCount] = useState(0);

const [editingUserId, setEditingUserId] = useState<string | null>(null);
const [editRole, setEditRole] = useState("");
const [editCredits, setEditCredits] = useState("");

async function getAdminUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id;
}

useEffect(() => {
  async function loadCurrentOrganization() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Utilisateur non connecté.");
      setLoadingOrganization(false);
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
      setMessage(data.error || "Organisation introuvable.");
      setLoadingOrganization(false);
      return;
    }

    setOrganizationId(data.organizationId);
    setLoadingOrganization(false);
  }

  loadCurrentOrganization();
}, []);


async function loadStats() {
    if (!organizationId) return;

  const adminUserId = await getAdminUserId();

  const response = await fetch("/api/organization/stats", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ organizationId,
    adminUserId, }),
  });

 

  const result = await response.json();

  if (!response.ok) {
    setMessage(result.error || "Erreur chargement stats");
    return;
  }

  setDistributedCredits(result.distributedCredits || 0);
  setMembersCount(result.membersCount || 0);
  setTotalCredits(result.totalCredits || 0);
}


useEffect(() => {
  if (!organizationId) return;

  loadStats();
  loadMembers();
}, [organizationId]);


async function loadMembers() {
    if (!organizationId) return;

  const adminUserId = await getAdminUserId();

  const res = await fetch("/api/organization/members", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
    organizationId,
    adminUserId, 
    }),
  });

  const data = await res.json();

  if (res.ok) {
    setMembers(data.members || []);
  }
}

if (loadingOrganization) {
  return (
    <main className="flex min-h-screen items-center justify-center">
      Chargement de l’organisation...
    </main>
  );
}

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold text-gray-900">
      Administration école
    </h1>

    <p className="mt-3 text-gray-600">
      Gère les membres, les crédits et les packs de ton organisation.
    </p>
  </div>

  <a
    href="/organization"
    className="rounded-lg bg-black px-5 py-3 text-white hover:bg-gray-800"
  >
    Acheter des crédits
  </a>
</div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Crédits école</p>
            <p className="mt-2 text-3xl font-bold">{totalCredits}</p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Crédits distribués</p>
            <p className="mt-2 text-3xl font-bold">{distributedCredits}</p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Crédits restants</p>
             <p className="mt-2 text-3xl font-bold">{remainingCredits}</p>
         </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Membres</p>
            <p className="mt-2 text-3xl font-bold">{membersCount}</p>
          </div>
        </div>

      

        <section className="mt-10 rounded-2xl border bg-white p-6 shadow-sm">
  <h2 className="text-xl font-semibold">Ajouter un membre</h2>

  <div className="mt-6 grid gap-4 md:grid-cols-3">
    <input
      type="email"
      placeholder="Email"
      className="rounded-xl border p-3"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />

    <select
        className="rounded-xl border p-3"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        >
  <option value="student">Élève coach</option>
  <option value="coach">Coach</option>
</select>

    <input
      type="number"
      placeholder="Crédits"
      className="rounded-xl border p-3"
      value={credits}
     onChange={(e) => setCredits(e.target.value)}
    />
  </div>

  <button
  onClick={async () => {
    const requestedCredits = Number(credits);

    if (requestedCredits > remainingCredits) {
    alert(`Il ne reste que ${remainingCredits} crédits disponibles.`);
    return;
    }

    setMessage("");

    if (!organizationId) {
    setMessage("Organisation introuvable.");
    return;
    }

    const adminUserId = await getAdminUserId();

    const response = await fetch("/api/organization/add-member", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        role,
        credits,
        organizationId,
        adminUserId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
    setMessage(result.error || JSON.stringify(result));
    return;
    }

    setMessage("Membre ajouté avec succès.");
    setEmail("");
    setRole("student");
    setCredits("");

    await loadMembers();

    setDistributedCredits((prev) => prev + requestedCredits);
    setMembersCount((prev) => prev + 1);
  }}
  className="mt-6 rounded-xl bg-black px-4 py-2 text-white"
>
  Ajouter le membre
</button>
{message && (
  <p className="mt-4 text-sm text-gray-600">
    {message}
  </p>
)}


<section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
  <h2 className="text-xl font-semibold">Membres de l’organisation</h2>

  <div className="mt-6 overflow-x-auto">
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b text-gray-500">
          <th className="py-3">Utilisateur</th>
          <th className="py-3">Rôle</th>
          <th className="py-3">Crédits</th>
          <th className="py-3">Utilisés</th>
          <th className="py-3">Restants</th>
          <th className="py-3">Actions</th>
        </tr>
      </thead>

      <tbody>
        {members.map((member) => {
          const remaining =
            Number(member.total_credits || 0) -
            Number(member.used_credits || 0);

          return (
            <tr key={`${member.organization_id}-${member.user_id}`} className="border-b">
              <td className="py-3">{member.email}</td>
              <td className="py-3">
                {editingUserId === member.user_id ? (
                <select
                        className="rounded-lg border px-2 py-1"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        >
                    <option value="student">Élève coach</option>
                    <option value="coach">Coach</option>
                    <option value="admin">Admin</option>
                 </select>
                ) : (
                    member.role === "student"
                     ? "Élève coach"
                     : member.role === "coach"
                     ? "Coach"
                    : member.role === "admin"
                    ? "Admin"
                    : "-"
                     )}
            </td>
            <td className="py-3">
                {editingUserId === member.user_id ? (
                <input
                    type="number"
                    className="w-24 rounded-lg border px-2 py-1"
                    value={editCredits}
                    onChange={(e) => setEditCredits(e.target.value)}
                    />
                ) : (
                member.total_credits
                )}
            </td>
              <td className="py-3">{member.used_credits}</td>
              <td className="py-3 font-semibold">{remaining}</td>
 <td className="py-3">
  {editingUserId === member.user_id ? (
    <>
      <button
        onClick={async () => {
          // ton code Enregistrer ici
        }}
        className="rounded-lg bg-black px-3 py-1 text-white"
      >
        Enregistrer
      </button>

      <button
        onClick={() => {
          setEditingUserId(null);
          setEditRole("");
          setEditCredits("");
        }}
        className="ml-2 rounded-lg border px-3 py-1"
      >
        Annuler
      </button>
    </>
  ) : member.role === "admin" ? (
    <span className="text-gray-400">🔒</span>
  ) : (
    <>
      <button
        onClick={() => {
          setEditingUserId(member.user_id);
          setEditRole(member.role);
          setEditCredits(String(member.total_credits));
        }}
        className="rounded-lg bg-black px-3 py-1 text-white"
      >
        Modifier
      </button>

      <button
        onClick={async () => {
          // ton code Supprimer ici
        }}
        className="ml-2 rounded-lg bg-red-600 px-3 py-1 text-white"
      >
        Supprimer
      </button>
    </>
  )}
</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</section>

</section>

       
      </div>
    </main>
  );
}