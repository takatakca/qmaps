import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Rocket } from "lucide-react";
import Seo from "@/components/Seo";
import BottomNav from "@/components/BottomNav";

interface PhaseRow {
  phase: string;
  theme: string;
  highlights: string;
}

const PHASES: PhaseRow[] = [
  { phase: "7", theme: "Paiements & facturation marchand", highlights: "Stripe checkout, portail client, plans, réconciliation webhook." },
  { phase: "8", theme: "Annonces sponsorisées", highlights: "Campagnes marchandes, modération admin, événements de placement, RLS isolée." },
  { phase: "9", theme: "Recommandations & confiance des avis", highlights: "Recommandations personnalisées, entreprises similaires, scoring IA assisté avec modération." },
  { phase: "10", theme: "PWA, légal & suppression de compte", highlights: "Manifeste PWA installable, pages légales EN/FR, flux complet de suppression avec audit." },
  { phase: "11", theme: "Playbooks opérationnels admin", highlights: "Avis, revendications, sponsorisé, facturation et suppressions sous docs/admin/." },
  { phase: "12", theme: "CI, env, performance & SEO", highlights: "GitHub Actions CI, .env.example, code-splitting Vite, SEO par route, tests d'actifs statiques." },
  { phase: "13", theme: "Vérifications release-candidate", highlights: "launchChecks.ts partagé, /admin/launch-status, scripts launch:check, notes de version." },
];

const ReleaseNotes = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24 max-w-2xl mx-auto">
      <Seo
        title="Notes de version · QMAPS"
        description="Résumé des phases livrées et statut release-candidate de QMAPS."
        canonicalPath="/release-notes"
        type="article"
      />

      <header className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3 pt-safe">
        <button onClick={() => navigate(-1)} aria-label="Retour">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <Rocket size={20} className="text-primary" />
        <h1 className="font-heading text-lg font-bold text-foreground truncate flex-1">
          Notes de version
        </h1>
      </header>

      <article className="px-4 py-6 space-y-6 text-sm leading-relaxed text-foreground">
        <section className="space-y-2">
          <h2 className="font-heading text-base font-bold">Release candidate actuelle</h2>
          <p className="text-muted-foreground">
            QMAPS est en mode <strong className="text-foreground">release candidate</strong>.
            La plateforme est complète pour un premier lancement public, avec tous les
            parcours consommateur, marchand et administrateur connectés à Lovable Cloud.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-base font-bold">Phases livrées</h2>
          <ul className="space-y-3">
            {PHASES.map((p) => (
              <li
                key={p.phase}
                className="rounded-xl border border-border bg-card p-3"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-xs text-primary">Phase {p.phase}</span>
                  <span className="font-heading font-semibold text-foreground">{p.theme}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{p.highlights}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-base font-bold">Vérifications manuelles restantes</h2>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
            <li>Clés Stripe en mode live et secret de webhook configurés.</li>
            <li>Domaine personnalisé DNS + SSL actifs (qmaps.app).</li>
            <li>Boîtes support, privacy, abuse et business surveillées quotidiennement.</li>
            <li>Checklist mobile parcourue sur un appareil iOS et Android réel.</li>
            <li>Approbation finale dans docs/app-store-readiness.md.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-base font-bold">Note de retour arrière</h2>
          <p className="text-muted-foreground">
            En cas de régression après publication, restaurer la version publiée
            précédente via l'historique du projet. L'état de la base de données
            n'est <strong className="text-foreground">pas</strong> rétabli automatiquement.
            Aucun service worker n'est enregistré : les clients reçoivent le retour
            arrière au prochain rechargement.
          </p>
        </section>

        <div className="pt-4 border-t border-border text-xs text-muted-foreground">
          <p>
            Pour le détail technique complet, consulter <span className="font-mono">docs/release-notes.md</span> dans le dépôt.
            Voir aussi nos <Link to="/support-policy" className="text-primary underline">politiques de support</Link>.
          </p>
        </div>
      </article>

      <BottomNav />
    </div>
  );
};

export default ReleaseNotes;
