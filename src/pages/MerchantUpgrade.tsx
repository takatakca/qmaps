import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, TrendingUp, Eye, Target, Award, Image, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

const FEATURES = [
  { icon: MessageSquare, title: "Rejoignez vos clients d'une nouvelle façon", desc: "Créez des publications importantes, des mises à jour ou des nouvelles sur votre entreprise pour les clients nouveaux et existants." },
  { icon: Eye, title: "Gardez l'attention sur votre entreprise", desc: "Le Package Upgrade élimine les publicités de concurrents de votre page. Cela aide à garder vos clients concentrés après qu'ils aient cliqué sur votre page." },
  { icon: Target, title: "Convertissez les visites en clients", desc: "Le Package Upgrade est optimisé pour convertir les vues de votre page en appels, messages et visites. Ajoutez un appel à l'action entièrement personnalisable." },
  { icon: TrendingUp, title: "Démarquez-vous dans les résultats de recherche", desc: "Distinguez-vous de vos concurrents avec des badges Business Highlights. Choisissez parmi 30+ badges accrocheurs pour mettre en valeur 2 points forts." },
  { icon: Award, title: "Renforcez la confiance et la notoriété", desc: "Téléchargez le logo de votre entreprise et affichez-le sur votre page et dans les résultats de recherche. Un moyen subtil mais efficace de donner une apparence plus professionnelle." },
  { icon: Image, title: "Choisissez vos photos vedettes", desc: "Les premières impressions sont importantes. Le diaporama vous permet de choisir les photos que vous souhaitez mettre en avant en haut de votre page." },
];

const MerchantUpgrade = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center mb-4">
          <ArrowLeft size={18} className="text-foreground" />
        </button>

        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Package Upgrade</h1>
        <p className="text-sm text-muted-foreground mb-1">
          Les entreprises voient en moyenne <span className="font-bold text-foreground">50 visites de page supplémentaires</span> 14 jours après la configuration.*
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Un ensemble de fonctionnalités qui augmente l'attrait de votre page et de votre entreprise.
        </p>

        <div className="space-y-1 mb-6">
          {["Se démarquer dans les résultats de recherche", "Mettre en valeur votre meilleur travail", "Convertir les vues en clients"].map(t => (
            <div key={t} className="flex items-center gap-2">
              <Check size={16} className="text-primary" />
              <span className="text-sm text-foreground">{t}</span>
            </div>
          ))}
          <p className="text-xs text-primary font-medium mt-1">💰 Seulement CA$6/jour moy (normalement CA$14/jour)</p>
        </div>

        <h2 className="font-heading font-bold text-foreground mb-4">Le Package Upgrade vous permet de…</h2>

        <div className="space-y-6 mb-8">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border p-4 rounded-xl mb-4">
          <p className="text-center text-sm font-bold text-foreground mb-1">Package Upgrade</p>
          <p className="text-center text-xs text-muted-foreground mb-3">
            Les paiements sont traités en toute sécurité via notre fournisseur (Stripe). QMAPS ne collecte jamais directement vos informations de carte.
          </p>
          <Button onClick={() => navigate("/merchant/billing/plans")} className="w-full rounded-full font-bold">
            Bientôt disponible · Voir les plans
          </Button>
          <button onClick={() => navigate(-1)} className="w-full text-center text-sm text-muted-foreground py-2">Annuler</button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default MerchantUpgrade;
