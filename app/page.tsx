import Link from "next/link";


export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Entraîne-toi au coaching avec un coaché IA
        </h1>

        <p className="mt-4 text-lg text-gray-600">
          Pratique des séances réalistes à l’oral, puis reçois un feedback pédagogique.
        </p>

        <Link
          href="/access"
          className="mt-8 inline-block rounded-xl bg-black px-6 py-3 text-white hover:opacity-90"
        >
          Choisir un Accès
        </Link>
      </div>
    </main>
  );
}