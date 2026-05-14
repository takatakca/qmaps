import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, HelpCircle, Store, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import Seo from "@/components/Seo";

const faqs = [
  "Comment fonctionne la facturation?",
  "Comment mesurer le succès de ma publicité?",
  "Comment mettre à jour ma page commerce?",
  "Pourquoi tous les avis ne sont-ils pas recommandés?",
  "Comment répondre aux avis de mon commerce?",
  "Comment me connecter?",
];

const Support = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <Seo
        title="Centre d'aide QMAPS — support, FAQ et contact"
        description="Trouvez des réponses sur la facturation, la gestion de votre commerce, la connexion à votre compte et le support QMAPS pour Montréal."
        canonicalPath="/support"
      />
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground">Centre d'aide</h1>
      </div>

      <div className="bg-muted px-4 py-8 text-center">
        <h2 className="text-xl font-bold text-foreground mb-4">Centre d'aide QMAPS</h2>
        <p className="text-sm text-muted-foreground mb-4">Comment pouvons-nous vous aider?</p>
        <div className="relative max-w-sm mx-auto">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Poser une question..."
            className="pl-4 pr-10 rounded-full"
          />
          <Button size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-7 px-3">
            <Search size={14} />
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-0 divide-y divide-border">
        {faqs.map((q, i) => (
          <button key={i} className="w-full text-left py-3.5 text-sm text-foreground hover:text-primary transition-colors">
            {q}
          </button>
        ))}
      </div>

      <div className="px-4 py-6 space-y-3">
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <Users size={32} className="mx-auto text-primary mb-2" />
          <h3 className="text-sm font-bold text-primary mb-1">QMAPS pour les consommateurs</h3>
          <p className="text-xs text-muted-foreground">Découvrez les meilleurs commerces locaux et partagez vos expériences.</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <Store size={32} className="mx-auto text-primary mb-2" />
          <h3 className="text-sm font-bold text-primary mb-1">QMAPS pour les commerces</h3>
          <p className="text-xs text-muted-foreground">Revendiquez votre page et connectez-vous avec vos clients.</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Support;
