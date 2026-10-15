import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, HelpCircle, Mail, Store, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import Seo from "@/components/Seo";
import { filterSupportFaqs } from "@/lib/supportFaq";

const Support = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const matches = filterSupportFaqs(query);

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <Seo
        title="Centre d'aide QMAPS — FAQ et contact"
        description="Réponses aux questions sur les commerces, les avis, les comptes, la facturation et le support QMAPS."
        canonicalPath="/support"
      />
      <header className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={() => navigate(-1)} aria-label="Retour">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="font-heading text-lg font-bold text-foreground">Centre d'aide</h1>
      </header>

      <section className="bg-muted px-4 py-8 text-center">
        <HelpCircle size={32} className="mx-auto text-primary mb-3" aria-hidden="true" />
        <h2 className="text-xl font-bold text-foreground mb-3">Comment pouvons-nous vous aider?</h2>
        <label htmlFor="qmaps-support-search" className="block text-sm text-muted-foreground mb-3">
          Rechercher dans les questions fréquentes
        </label>
        <div className="relative max-w-sm mx-auto">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="qmaps-support-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Facturation, avis, compte..."
            className="pl-10 rounded-full"
          />
        </div>
      </section>

      <section className="px-4 py-6">
        <h3 className="font-heading font-bold text-foreground mb-3">Questions fréquentes</h3>
        {matches.length === 0 ? (
          <div role="status" className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
            Aucun résultat pour « {query} ». Consultez les informations de contact ci-dessous.
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card px-4">
            {matches.map((item) => (
              <details key={item.id} className="group py-4">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">
                  {item.question}
                </summary>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">{item.answer}</p>
                <Link to={item.link} className="inline-block text-sm text-primary font-medium mt-3 hover:underline">
                  {item.linkLabel}
                </Link>
              </details>
            ))}
          </div>
        )}
      </section>

      <section className="px-4 pb-6">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Mail size={20} className="text-primary" aria-hidden="true" />
            <h3 className="font-heading font-bold text-foreground">Besoin d'aide supplémentaire?</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Consultez les coordonnées et le formulaire qui prépare un courriel dans votre application de messagerie. L'envoi n'est pas automatique.
          </p>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/support-policy">Coordonnées et contact</Link>
          </Button>
        </div>
      </section>

      <div className="px-4 pb-6 grid grid-cols-2 gap-3">
        <Link to="/" className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/40">
          <Users size={24} className="mx-auto text-primary mb-2" aria-hidden="true" />
          <span className="text-sm font-medium text-foreground">Découvrir les commerces</span>
        </Link>
        <Link to="/merchant" className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/40">
          <Store size={24} className="mx-auto text-primary mb-2" aria-hidden="true" />
          <span className="text-sm font-medium text-foreground">Espace commerçant</span>
        </Link>
      </div>
      <BottomNav />
    </div>
  );
};

export default Support;
