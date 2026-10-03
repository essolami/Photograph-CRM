import type { Metadata } from "next";
import { Brand } from "../sidebar";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Graduation",
  description:
    "Comment Photograph CRM collecte, utilise et protège les données du studio Graduation, y compris l’accès à Google Calendar.",
};

// Page publique : elle doit rester accessible sans session, car Google vérifie
// cette URL depuis la console OAuth.
export default function PrivacyPolicyPage() {
  const sections: { title: string; paragraphs: string[] }[] = [
    {
      title: "Qui sommes-nous",
      paragraphs: [
        "Photograph CRM est l’outil interne de gestion du studio Graduation (photographie de soutenance). Il est utilisé par les collaborateurs du studio pour suivre les dossiers clients, les prestations et les règlements.",
        "Responsable du traitement : studio Graduation. Contact : essolamih@gmail.com.",
      ],
    },
    {
      title: "Données que nous traitons",
      paragraphs: [
        "Données saisies par le studio sur ses clients : nom, téléphone, adresse e-mail facultative, faculté, date et heure de soutenance, pack et suppléments choisis, montants (total, avance, réduction), photographe et monteur affectés, statut du dossier et commentaires.",
        "Données des comptes utilisateurs du studio : nom, adresse e-mail, rôle et autorisations, mot de passe conservé uniquement sous forme d’empreinte chiffrée (jamais en clair).",
        "Aucune donnée n’est collectée à des fins publicitaires et nous ne pratiquons aucun profilage automatisé.",
      ],
    },
    {
      title: "Accès à Google Calendar",
      paragraphs: [
        "Lorsqu’un administrateur connecte un compte Google, l’application demande l’autorisation « Google Calendar – événements » (googleapis.com/auth/calendar.events), ainsi que l’adresse e-mail et le profil de base du compte, uniquement pour afficher quel compte est connecté.",
        "Cette autorisation sert exclusivement à créer et mettre à jour, dans le calendrier du compte connecté, un événement par soutenance. L’événement reprend le nom du client, la date et l’heure, la faculté, la prestation, le téléphone, le commentaire et les montants du dossier.",
        "L’application ne lit pas vos autres événements, n’en supprime aucun et ne consulte aucun autre calendrier. Nous conservons le jeton de rafraîchissement Google et l’identifiant de chaque événement créé, afin de pouvoir mettre à jour l’événement si le dossier change.",
        "L’utilisation par Photograph CRM des informations reçues des API Google respecte la Google API Services User Data Policy, y compris ses exigences d’utilisation limitée (Limited Use). Ces données ne sont ni vendues, ni transmises à des tiers, ni utilisées à des fins publicitaires, ni exploitées pour entraîner des modèles d’intelligence artificielle.",
      ],
    },
    {
      title: "Hébergement et sécurité",
      paragraphs: [
        "Les données sont enregistrées dans une base PostgreSQL hébergée par Neon dans l’Union européenne, et l’application est hébergée par Vercel. Les échanges se font en HTTPS.",
        "L’accès est restreint aux comptes du studio : chaque utilisateur dispose d’un rôle, et les montants comme les coordonnées des clients ne sont visibles que par les rôles autorisés. La session repose sur un cookie strictement nécessaire (`luma_session`) ; aucun cookie publicitaire ni traceur tiers n’est utilisé.",
      ],
    },
    {
      title: "Durée de conservation",
      paragraphs: [
        "Les dossiers clients sont conservés tant qu’ils sont utiles au suivi de l’activité du studio et aux obligations comptables. Les sessions expirent automatiquement au bout de quatorze jours.",
        "La déconnexion de Google Calendar depuis les paramètres supprime notre accès au calendrier ; les événements déjà créés restent dans votre agenda et peuvent y être supprimés directement.",
      ],
    },
    {
      title: "Vos droits",
      paragraphs: [
        "Vous pouvez demander l’accès, la rectification ou la suppression des données vous concernant en écrivant à essolamih@gmail.com. Nous répondons dans un délai raisonnable.",
        "Vous pouvez à tout moment révoquer l’accès de l’application à votre compte Google depuis la page « Vos connexions à des applications tierces » de votre compte Google (myaccount.google.com/connections).",
      ],
    },
  ];
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Brand />
      <h1 className="mt-10 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
        Politique de confidentialité
      </h1>
      <p className="mt-3 text-sm text-slate-500">
        Dernière mise à jour : 3 octobre 2026
      </p>
      <div className="mt-10 space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-sm leading-7 text-slate-600">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
      <p className="mt-12 border-t border-slate-200 pt-6 text-xs text-slate-500">
        Pour toute question sur cette politique, écrivez à essolamih@gmail.com.
      </p>
    </main>
  );
}
