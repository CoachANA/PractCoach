export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">
        Politique de confidentialité — PractCoach
      </h1>

      <p>Dernière mise à jour : Mai 2026</p>

      <p>
        PractCoach respecte votre vie privée et s’engage à protéger vos
        données personnelles.
      </p>

      <section>
        <h2 className="text-xl font-semibold">Données collectées</h2>
        <p>
          L’application peut collecter les informations suivantes :
        </p>
        <ul className="list-disc ml-6">
          <li>adresse e-mail de connexion ;</li>
          <li>contenus des sessions de coaching et échanges avec l’IA ;</li>
          <li>données techniques nécessaires au fonctionnement de l’application.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Utilisation des données</h2>
        <p>Les données sont utilisées uniquement pour :</p>
        <ul className="list-disc ml-6">
          <li>permettre l’accès à l’application ;</li>
          <li>générer des simulations de coaching ;</li>
          <li>améliorer l’expérience utilisateur ;</li>
          <li>assurer la sécurité du service.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Partage des données</h2>
        <p>
          Les données ne sont pas vendues à des tiers.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Contact</h2>
        <p>support@practcoach.com</p>
      </section>
    </main>
  );
}