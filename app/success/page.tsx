import { Suspense } from "react";
import SuccessContent from "./SuccessContent";

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white">
          <p className="text-gray-600">Chargement...</p>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}