export default function TermsPage() {
  return (
    <main className="max-w-5xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">
        Conditions d’utilisation — PractCoach
      </h1>

      <p>Dernière mise à jour : Juillet 2026</p>

      <p>
        Les présentes conditions régissent l’utilisation de l’application
        PractCoach et de ses services.
      </p>

      <section>
        <h2 className="text-xl font-semibold">
          1. Présentation du service
        </h2>
        <p>
          PractCoach est une application d’entraînement destinée aux coachs et
          aux personnes souhaitant pratiquer des simulations de séances de
          coaching avec une intelligence artificielle.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          2. Création et utilisation du compte
        </h2>
        <p>
          L’utilisateur doit fournir des informations exactes lors de la
          création de son compte et préserver la confidentialité de ses
          identifiants. Toute utilisation effectuée depuis son compte relève de
          sa responsabilité.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          3. Crédits et achats
        </h2>

        <p>
          Certaines fonctionnalités nécessitent l’utilisation de crédits. Les crédits peuvent être obtenus gratuitement ou achetés selon les offres affichées dans l'application. Les tarifs peuvent évoluer au fil du temps.
        </p>

        <p>
          Sur Android, les achats effectués dans l’application sont traités par
          Google Play. Sur iOS, ils sont traités par l’App Store. Les prix et
          conditions applicables sont affichés avant chaque achat.
        </p>

        <p>
          Les crédits sont réservés à l’utilisation des services PractCoach.
          Ils ne constituent pas une monnaie, ne peuvent pas être transférés et
          ne peuvent pas être échangés contre de l’argent.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          4. Remboursements
        </h2>
        <p>
          Les demandes de remboursement concernant un achat effectué via
          Google Play ou l’App Store sont traitées conformément aux règles de
          la plateforme concernée et à la législation applicable.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          5. Utilisation autorisée
        </h2>

        <p>L’utilisateur s’engage notamment à ne pas :</p>

        <ul className="list-disc ml-6">
          <li>utiliser le service à des fins illégales ou frauduleuses ;</li>
          <li>
            tenter de contourner les mécanismes de paiement ou de sécurité ;
          </li>
          <li>perturber le fonctionnement de l’application ;</li>
          <li>utiliser l’application pour nuire à autrui.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          6. Intelligence artificielle
        </h2>
        <p>
          Les réponses et simulations générées par l’intelligence artificielle
          sont fournies à des fins d’entraînement. Elles peuvent contenir des
          erreurs et ne constituent pas un avis médical, juridique, financier
          ou professionnel.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          7. Disponibilité du service
        </h2>
        <p>
          PractCoach s’efforce d’assurer la disponibilité du service, sans
          garantir un fonctionnement continu ou exempt d’erreurs. Le service
          peut être modifié, suspendu ou interrompu pour des raisons
          techniques, réglementaires ou de sécurité.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          8. Propriété intellectuelle
        </h2>
        <p>
          L’application, sa marque, son contenu, ses interfaces et ses éléments
          techniques sont protégés. Aucun droit de propriété intellectuelle
          n’est transféré à l’utilisateur.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          9. Suspension ou suppression du compte
        </h2>
        <p>
          PractCoach peut suspendre ou supprimer un compte en cas de fraude,
          d’abus, de violation des présentes conditions ou de risque pour la
          sécurité du service.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          10. Données personnelles
        </h2>
         <p>
            Le traitement des données personnelles est décrit dans notre{" "}
            <a
            href="/privacy"
            className="text-blue-600 underline hover:text-blue-800"
            >
            Politique de confidentialité
            </a>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          11. Modification des conditions
        </h2>
        <p>
          Les présentes conditions peuvent être mises à jour afin de tenir
          compte de l’évolution du service, de la réglementation ou des
          fonctionnalités. La date de mise à jour est indiquée en haut de la
          page.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          12. Contact
        </h2>

        <p>
          <a
            href="mailto:support@practcoach.com"
            className="underline"
          >
            support@practcoach.com
          </a>
        </p>
      </section>
    </main>
  );
}