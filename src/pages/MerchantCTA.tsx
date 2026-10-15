import { Link } from "react-router-dom";
import { MousePointerClick, ExternalLink, Phone } from "lucide-react";
import MerchantPageHeader from "@/components/merchant/layout/MerchantPageHeader";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";

const MerchantCTA = () => (
  <main className="min-h-screen bg-background max-w-lg mx-auto pb-16">
    <Seo title="Bouton d'action — QMAPS" description="Renseignements sur les boutons d'action promotionnels QMAPS." noindex />
    <MerchantPageHeader title="Bouton d'action" back="/merchant/more" />
    <div className="px-5 pt-8 space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <MousePointerClick size={34} className="text-primary" aria-hidden="true" />
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Promotions et boutons d'action — en préparation
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Les campagnes « Bouton d'action » personnalisées ne sont pas encore activées dans QMAPS.
          Cette page ne crée aucune promotion, aucun rabais et aucun paiement.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Aucun prix ni avantage publicitaire ne sera garanti sans une offre réellement configurée et publiée.
        </p>
      </section>

      <section className="rounded-2xl border border-border p-5 space-y-4">
        <h2 className="font-heading font-bold text-lg text-foreground">Fonctions déjà disponibles</h2>
        <div className="flex gap-3">
          <Phone size={20} className="text-primary shrink-0" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Ajoutez le téléphone et l'adresse de votre site dans les informations de votre commerce
            pour permettre aux visiteurs de vous contacter.
          </p>
        </div>
        <Button asChild className="w-full rounded-full">
          <Link to="/merchant/business-info">Gérer mes informations</Link>
        </Button>
        <div className="flex gap-3">
          <ExternalLink size={20} className="text-primary shrink-0" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Les campagnes de visibilité réellement créées peuvent être consultées depuis l'espace publicitaire.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full rounded-full">
          <Link to="/merchant/sponsored">Voir mes campagnes</Link>
        </Button>
      </section>
    </div>
  </main>
);

export default MerchantCTA;
