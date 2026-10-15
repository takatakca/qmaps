import { Link } from "react-router-dom";
import { CalendarDays, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import MerchantPageHeader from "@/components/merchant/layout/MerchantPageHeader";
import Seo from "@/components/Seo";

/**
 * QMAPS Guest Manager has no deployed booking backend at present.
 * Never collect a lead and report "sent" locally or display unverified
 * prices, testimonials or network reach as if reservations were live.
 */
const MerchantGuestManager = () => (
  <main className="min-h-screen bg-background max-w-lg mx-auto pb-12">
    <Seo
      title="QMAPS Guest Manager — information"
      description="Renseignements sur le projet de gestion de réservations QMAPS."
      noindex
    />
    <MerchantPageHeader title="QMAPS Guest Manager" back="/merchant/more" />

    <div className="px-5 py-10 space-y-7">
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <CalendarDays size={36} className="text-primary" aria-hidden="true" />
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Gestion des réservations — en préparation
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Le service QMAPS Guest Manager n'est pas encore activé.
          Cette page ne permet pas actuellement de recevoir, confirmer ou gérer des réservations.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Aucun forfait Guest Manager ne peut être souscrit ici et aucune demande n'est
          enregistrée automatiquement lorsque vous consultez cette présentation.
        </p>
      </div>

      <section className="rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Mail size={21} className="text-primary" aria-hidden="true" />
          <h2 className="font-heading text-lg font-bold text-foreground">Vous souhaitez en savoir plus?</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Consultez la page officielle de contact QMAPS pour obtenir les coordonnées et
          préparer un courriel. Le message ne sera pas envoyé sans votre intervention.
        </p>
        <Button asChild className="w-full rounded-full">
          <Link to="/support-policy">Voir les coordonnées de contact</Link>
        </Button>
        <Button asChild variant="outline" className="w-full rounded-full">
          <Link to="/merchant">Retour à mon commerce</Link>
        </Button>
      </section>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck size={16} className="text-primary shrink-0" aria-hidden="true" />
        Les réservations, disponibilités, tarifs et paiements ne seront affichés que
        lorsqu'un service de réservation réel et autorisé sera opérationnel.
      </p>
    </div>
  </main>
);

export default MerchantGuestManager;
