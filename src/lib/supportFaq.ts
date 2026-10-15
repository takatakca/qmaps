export interface SupportFaq {
  id: string;
  question: string;
  answer: string;
  link: string;
  linkLabel: string;
}

/** Answers link to existing QMAPS pages; no invented customer-service bot. */
export const supportFaqs: SupportFaq[] = [
  {
    id: "billing",
    question: "Comment consulter la facturation de mon entreprise?",
    answer: "Après connexion au compte commerçant, ouvrez Facturation. Le solde détaillé et les paiements dépendent de la configuration du fournisseur de paiement.",
    link: "/merchant/billing",
    linkLabel: "Consulter la facturation",
  },
  {
    id: "ads",
    question: "Où suivre mes publicités?",
    answer: "Les campagnes de visibilité et leurs statuts sont accessibles depuis le tableau de bord marchand. Les résultats affichés dépendent des événements réellement enregistrés.",
    link: "/merchant/sponsored",
    linkLabel: "Voir mes campagnes",
  },
  {
    id: "listing",
    question: "Comment mettre à jour ma page commerce?",
    answer: "Accédez aux informations de votre entreprise pour modifier la description, les horaires, les catégories et les coordonnées.",
    link: "/merchant/business-info",
    linkLabel: "Modifier ma fiche",
  },
  {
    id: "reviews",
    question: "Comment répondre aux avis de mon commerce?",
    answer: "Depuis l'onglet Avis du tableau de bord commerçant, sélectionnez un commentaire et publiez votre réponse lorsque ce service est disponible sur votre compte.",
    link: "/merchant?tab=reviews",
    linkLabel: "Voir les avis",
  },
  {
    id: "login",
    question: "Comment me connecter?",
    answer: "Ouvrez l'écran de connexion QMAPS. Pour un accès professionnel, utilisez le compte auquel votre commerce est rattaché.",
    link: "/auth",
    linkLabel: "Se connecter",
  },
  {
    id: "privacy",
    question: "Comment consulter ou supprimer mes données?",
    answer: "Les paramètres du compte proposent les options de confidentialité et de suppression. Consultez aussi les politiques applicables avant de soumettre une demande.",
    link: "/settings/delete-account",
    linkLabel: "Gérer la suppression du compte",
  },
];

const normalize = (text: string): string => text
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase("fr-CA")
  .trim();

export function filterSupportFaqs(query: string, faqs: readonly SupportFaq[] = supportFaqs): SupportFaq[] {
  const needle = normalize(query);
  if (!needle) return [...faqs];
  return faqs.filter((faq) =>
    normalize(faq.question).includes(needle) ||
    normalize(faq.answer).includes(needle),
  );
}
