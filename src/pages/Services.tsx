import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Store, Sparkles, ChevronRight, Briefcase } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import Seo from "@/components/Seo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Popular services — frontend shortcuts that map a user-facing service label
 * to an existing QMAPS category slug. We DO NOT create new DB categories here;
 * if a slug does not exist in the live taxonomy the public category page will
 * gracefully show its own empty state.
 */
const POPULAR_SERVICES: { label: string; slug: string }[] = [
  { label: "Entraîneurs personnels", slug: "personal-trainers" },
  { label: "Préparation d'impôts", slug: "tax-services" },
  { label: "Tenue de livres", slug: "bookkeeping" },
  { label: "Ménage résidentiel", slug: "cleaning" },
  { label: "Photographie générale", slug: "photographers" },
  { label: "Design web", slug: "web-design" },
  { label: "Jardinage", slug: "gardening" },
  { label: "Conseillers financiers", slug: "financial-advisors" },
  { label: "Entrepreneurs en construction", slug: "contractors" },
  { label: "Peinture intérieure", slug: "painters" },
  { label: "Électriciens", slug: "electricians" },
  { label: "Agents de sécurité", slug: "security-services" },
  { label: "Coaching de vie", slug: "life-coach" },
  { label: "Gestion immobilière", slug: "property-management" },
  { label: "Comptabilité", slug: "accountants" },
  { label: "DJ", slug: "djs" },
  { label: "Marketing médias sociaux", slug: "social-media-marketing" },
  { label: "Comptabilité d'entreprise", slug: "business-accounting" },
  { label: "Traiteur", slug: "caterers" },
  { label: "Toiture", slug: "roofing" },
  { label: "Homme à tout faire", slug: "handyman" },
  { label: "Avocats en immigration", slug: "immigration-law" },
  { label: "Ingénieur en structure", slug: "structural-engineers" },
  { label: "Détectives privés", slug: "private-investigation" },
  { label: "Agences de marketing", slug: "marketing" },
  { label: "Spécialistes SEO", slug: "seo-services" },
  { label: "Rénovation salle de bain", slug: "bathroom-remodel" },
  { label: "Services architecturaux", slug: "architects" },
  { label: "Design graphique", slug: "graphic-design" },
];

const SERVICE_GROUPS: { title: string; items: string[] }[] = [
  { title: "Design & Web", items: ["Design web", "Design graphique", "Développement logiciel", "SEO"] },
  { title: "Maison & Rénovation", items: ["Plomberie", "Électricité", "Toiture", "Peinture", "Salle de bain", "Cuisine"] },
  { title: "Santé & Bien-être", items: ["Coaching", "Massothérapie", "Nutrition", "Psychologie"] },
  { title: "Cours & Apprentissage", items: ["Cours académiques", "Cours de musique", "Langues", "Loisirs"] },
  { title: "Production & Médias", items: ["Photographie", "Vidéo", "Rédaction", "Traduction", "DJ"] },
  { title: "Pros & Affaires", items: ["Comptabilité", "Droit", "Marketing", "Coaching d'affaires"] },
  { title: "Maison extérieur", items: ["Jardinage", "Paysagement", "Piscines & spas", "Déneigement"] },
  { title: "Sécurité & Spécialistes", items: ["Serrurerie", "Alarme & incendie", "Détectives privés"] },
  { title: "Transport & Logistique", items: ["Déménagement", "Livraison", "Auto"] },
  { title: "Événementiel", items: ["Traiteur", "Animation", "DJ", "Location de salle"] },
];

const Services = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filteredPopular = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return POPULAR_SERVICES;
    return POPULAR_SERVICES.filter((s) => s.label.toLowerCase().includes(q));
  }, [query]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SERVICE_GROUPS;
    return SERVICE_GROUPS
      .map((g) => ({ ...g, items: g.items.filter((it) => it.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [query]);

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto">
      <Seo
        title="Services professionnels au Québec — Annuaire QMAPS"
        description="Trouvez des professionnels locaux au Québec : rénovation, ménage, comptabilité, marketing, photographie et plus. Demandez un devis ou inscrivez votre entreprise sur QMAPS."
        canonicalPath="/services"
      />

      {/* Hero */}
      <div className="relative px-4 pt-6 pb-5 bg-gradient-to-b from-secondary/60 to-background">
        <h1 className="font-heading text-2xl font-bold text-foreground">Services au Québec</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Trouvez un professionnel local pour votre prochain projet.
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2.5 shadow-soft focus-within:shadow-glow transition-shadow">
          <Search size={16} className="text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un service…"
            className="border-0 shadow-none focus-visible:ring-0 h-7 px-0"
            aria-label="Rechercher un service"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => navigate("/projects")} size="sm" className="rounded-full gap-1.5">
            <Briefcase size={14} /> Publier un projet
          </Button>
          <Button
            onClick={() => navigate("/auth?role=merchant")}
            size="sm"
            variant="outline"
            className="rounded-full gap-1.5"
          >
            <Store size={14} /> Enregistrer mon entreprise
          </Button>
        </div>
      </div>

      {/* Popular services */}
      <section className="px-4 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-primary" />
          <h2 className="font-heading text-lg font-bold text-foreground">Services populaires</h2>
        </div>
        {filteredPopular.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun service ne correspond à « {query} ».</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredPopular.map((s) => (
              <Link
                key={s.slug + s.label}
                to={`/c/${s.slug}`}
                className="group flex items-center justify-between rounded-2xl border border-border bg-card px-3.5 py-3 hover:border-primary/40 hover:shadow-soft transition-all"
              >
                <span className="text-sm font-medium text-foreground line-clamp-2">{s.label}</span>
                <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Service groups */}
      <section className="px-4 pt-7">
        <h2 className="font-heading text-lg font-bold text-foreground mb-3">Tous les services</h2>
        <div className="space-y-3">
          {filteredGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun groupe ne correspond à votre recherche.</p>
          ) : (
            filteredGroups.map((g) => (
              <div key={g.title} className="rounded-2xl border border-border bg-card p-4">
                <h3 className="font-heading text-sm font-semibold text-foreground mb-2">{g.title}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((it) => (
                    <button
                      key={it}
                      onClick={() => navigate(`/search?q=${encodeURIComponent(it)}`)}
                      className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
                    >
                      {it}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Pro CTA */}
      <section className="px-4 pt-7">
        <div className="rounded-2xl bg-brand-gradient text-primary-foreground p-5 shadow-elevated">
          <h3 className="font-heading text-lg font-bold">Vous êtes un professionnel?</h3>
          <p className="text-sm opacity-90 mt-1">
            Recevez des demandes de clients du Québec et faites grandir votre entreprise sur QMAPS.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => navigate("/auth?role=merchant")} size="sm" variant="secondary" className="rounded-full">
              Créer mon profil pro
            </Button>
            <Button
              onClick={() => navigate("/merchant/onboarding")}
              size="sm"
              variant="outline"
              className="rounded-full bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
            >
              Devenir professionnel
            </Button>
          </div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
};

export default Services;
