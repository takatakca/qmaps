import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import SearchBar from "@/components/SearchBar";
import CategoryRow from "@/components/CategoryRow";
import BusinessCard from "@/components/BusinessCard";
import BottomNav from "@/components/BottomNav";
import NearbySection from "@/components/home/NearbySection";
import FeaturedBusinesses from "@/components/home/FeaturedBusinesses";
import TrendingCollections from "@/components/home/TrendingCollections";
import HorizontalShortcutRow from "@/components/home/HorizontalShortcutRow";
import StartProjectCTA from "@/components/home/StartProjectCTA";
import SponsoredListings from "@/components/sponsored/SponsoredListings";
import RecommendedSection from "@/components/recommendations/RecommendedSection";
import { useRecommendedBusinesses } from "@/hooks/useRecommendedBusinesses";
import { useNearbyBusinesses } from "@/hooks/useNearbyBusinesses";
import { mapBusinessToCard } from "@/lib/business";
import Seo from "@/components/Seo";
import type { Tables } from "@/integrations/supabase/types";
import {
  UtensilsCrossed, Coffee, ShoppingBasket, Pill, Bike, Store,
  Sparkles as SparkIcon, Zap, Wrench, HardHat, Calculator, Scale,
  Camera, Megaphone, Dumbbell, FileText, MapPin, Building2,
} from "lucide-react";

const RESTAURANT_SHORTCUTS = [
  { label: "Restaurants québécois", q: "restaurants québécois", icon: UtensilsCrossed, tint: "bg-orange-500/10" },
  { label: "Cafés", q: "cafés", icon: Coffee, tint: "bg-amber-500/10" },
  { label: "Bistros", q: "bistros", icon: UtensilsCrossed, tint: "bg-red-500/10" },
  { label: "Poutineries", q: "poutineries", icon: UtensilsCrossed, tint: "bg-yellow-500/10" },
  { label: "Brasseries", q: "brasseries", icon: UtensilsCrossed, tint: "bg-amber-600/10" },
  { label: "Pâtisseries", q: "pâtisseries", icon: Coffee, tint: "bg-pink-500/10" },
];

const POPULAR_SERVICES = [
  { label: "Nettoyage", q: "nettoyage", icon: SparkIcon, tint: "bg-cyan-500/10" },
  { label: "Électriciens", q: "électriciens", icon: Zap, tint: "bg-yellow-500/10" },
  { label: "Plomberie", q: "plomberie", icon: Wrench, tint: "bg-blue-500/10" },
  { label: "Comptables", q: "comptables", icon: Calculator, tint: "bg-emerald-500/10" },
  { label: "Avocats", q: "avocats", icon: Scale, tint: "bg-indigo-500/10" },
  { label: "Construction", q: "construction", icon: HardHat, tint: "bg-orange-500/10" },
  { label: "Marketing", q: "marketing", icon: Megaphone, tint: "bg-fuchsia-500/10" },
  { label: "Photographes", q: "photographes", icon: Camera, tint: "bg-violet-500/10" },
  { label: "Entraîneurs privés", q: "entraîneur privé", icon: Dumbbell, tint: "bg-rose-500/10" },
  { label: "Impôts", q: "impôts", icon: FileText, tint: "bg-teal-500/10" },
];

const ESSENTIALS = [
  { label: "Épicerie", q: "épicerie", icon: ShoppingBasket, tint: "bg-green-500/10" },
  { label: "Dépanneurs", q: "dépanneur", icon: Store, tint: "bg-orange-500/10" },
  { label: "Restaurants", q: "restaurants", icon: UtensilsCrossed, tint: "bg-red-500/10" },
  { label: "Cafés", q: "cafés", icon: Coffee, tint: "bg-amber-500/10" },
  { label: "Pharmacies", q: "pharmacie", icon: Pill, tint: "bg-emerald-500/10" },
  { label: "Livraison", q: "livraison", icon: Bike, tint: "bg-blue-500/10" },
  { label: "Plats à emporter", q: "à emporter", icon: UtensilsCrossed, tint: "bg-yellow-500/10" },
];

const NEARBY_HINTS = [
  { label: "Montréal", to: "/city/montreal", icon: MapPin, tint: "bg-primary/10" },
  { label: "Québec", to: "/city/quebec", icon: MapPin, tint: "bg-primary/10" },
  { label: "Laval", to: "/city/laval", icon: MapPin, tint: "bg-primary/10" },
  { label: "Gatineau", to: "/city/gatineau", icon: MapPin, tint: "bg-primary/10" },
  { label: "Sherbrooke", to: "/city/sherbrooke", icon: MapPin, tint: "bg-primary/10" },
  { label: "Trois-Rivières", to: "/city/trois-rivieres", icon: MapPin, tint: "bg-primary/10" },
];

const PROS_RECOMMENDED = [
  { label: "Rénovation cuisine", q: "rénovation cuisine", icon: HardHat, tint: "bg-orange-500/10" },
  { label: "Design web", q: "design web", icon: Megaphone, tint: "bg-violet-500/10" },
  { label: "Architectes", q: "architectes", icon: Building2, tint: "bg-blue-500/10" },
  { label: "Coachs d'affaires", q: "coach affaires", icon: Dumbbell, tint: "bg-rose-500/10" },
  { label: "Notaires", q: "notaires", icon: Scale, tint: "bg-indigo-500/10" },
  { label: "Traduction", q: "traduction", icon: FileText, tint: "bg-teal-500/10" },
];

const Index = () => {
  const [businesses, setBusinesses] = useState<Tables<"businesses">[]>([]);
  const [loading, setLoading] = useState(true);
  const { businesses: nearbyBusinesses } = useNearbyBusinesses(4);
  const { recommended, trending, loading: recLoading } = useRecommendedBusinesses({ limit: 5 });

  useEffect(() => {
    const fetchBusinesses = async () => {
      const { data } = await supabase
        .from("businesses")
        .select("*")
        .order("avg_rating", { ascending: false });
      setBusinesses(data || []);
      setLoading(false);
    };
    fetchBusinesses();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <Seo
        title="QMaps Québec — Commerces, services et pros locaux"
        description="Découvrez les meilleurs commerces, restaurants et professionnels du Québec avec QMaps."
        canonicalPath="/"
      />
      {/* Header */}
      <header className="relative px-4 pt-6 pb-6 bg-brand-gradient-soft border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-[26px] font-bold tracking-tight">
            <span className="text-foreground">Q</span>
            <span className="text-brand-gradient">Maps</span>
          </h1>
          <a
            href="/city/montreal"
            className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold bg-card border border-border px-3 py-1.5 rounded-full shadow-soft hover:shadow-glow transition-shadow"
          >
            <MapPin size={12} /> Montréal
          </a>
        </div>
        <div className="mb-5">
          <h2 className="font-heading text-[24px] leading-[1.15] font-bold text-foreground">
            Découvrez le meilleur du <span className="text-brand-gradient">Québec</span>.
          </h2>
          <p className="text-[15px] text-muted-foreground mt-2 leading-relaxed">
            Commerces locaux, avis honnêtes et pros de confiance — près de chez vous.
          </p>
        </div>
        <SearchBar smart />
        <p className="text-xs text-muted-foreground mt-3 text-center leading-snug">
          Trouvez les meilleurs commerces, services et professionnels du Québec.
        </p>

        {/* Quick search chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { label: "Restaurants", q: "restaurants" },
            { label: "Nettoyage", q: "nettoyage" },
            { label: "Électriciens", q: "électriciens" },
            { label: "Comptables", q: "comptables" },
            { label: "Avocats", q: "avocats" },
            { label: "Construction", q: "construction" },
            { label: "Beauté", q: "beauté" },
            { label: "Santé", q: "santé" },
          ].map((chip) => (
            <a
              key={chip.q}
              href={`/search?q=${encodeURIComponent(chip.q)}`}
              className="inline-flex items-center px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium text-foreground shadow-soft hover:shadow-glow hover:border-primary/30 hover:text-primary transition-all"
            >
              {chip.label}
            </a>
          ))}
        </div>
      </header>

      {/* Categories */}
      <main className="space-y-6">
        <div className="px-4 mt-5">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="font-heading text-base font-bold text-foreground">
                Explorer par service
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Les catégories les plus recherchées au Québec.
              </p>
            </div>
            <a href="/services" className="text-xs font-semibold text-primary hover:underline whitespace-nowrap">
              Voir tous les services
            </a>
          </div>
          <CategoryRow />
        </div>

        <div className="px-4">
          <HorizontalShortcutRow
            title="Meilleurs restaurants près de vous"
            subtitle="Restaurants, cafés et bistros à découvrir au Québec."
            items={RESTAURANT_SHORTCUTS}
            seeAllHref="/search?q=restaurants"
          />
        </div>

        <div className="px-4">
          <HorizontalShortcutRow
            title="Services populaires au Québec"
            subtitle="Les pros les plus demandés cette semaine."
            items={POPULAR_SERVICES}
            seeAllHref="/services"
          />
        </div>

        <div className="px-4">
          <HorizontalShortcutRow
            title="À proximité"
            subtitle={
              nearbyBusinesses.length
                ? "Repérés autour de vous"
                : "Explorez les villes du Québec"
            }
            items={NEARBY_HINTS}
          />
        </div>

        <div className="px-4">
          <HorizontalShortcutRow
            title="Épicerie, restaurants et essentiels"
            subtitle="Tout ce qu'il vous faut au quotidien."
            items={ESSENTIALS}
          />
        </div>

        <div className="px-4">
          <StartProjectCTA />
        </div>

        <div className="px-4">
          <HorizontalShortcutRow
            title="Professionnels recommandés"
            subtitle="Des pros de confiance pour vos projets."
            items={PROS_RECOMMENDED}
            seeAllHref="/services"
          />
        </div>

        {/* Professional CTA */}
        <div className="px-4">
          <div className="rounded-2xl bg-card border border-border p-5 shadow-soft">
            <h3 className="font-heading text-base font-bold text-foreground">
              Vous êtes un professionnel ?
            </h3>
            <p className="text-sm mt-1 text-muted-foreground leading-relaxed">
              Rejoignez les milliers d'entreprises québécoises visibles sur QMAPS.
            </p>
            <a
              href="/merchant/onboarding"
              className="inline-flex items-center mt-4 px-5 py-2.5 rounded-full bg-brand-gradient text-primary-foreground text-sm font-semibold shadow-soft hover:shadow-glow transition-shadow"
            >
              Enregistrer mon entreprise
            </a>
          </div>
        </div>

        <SponsoredListings placement="home" />

        {/* Feed */}
        <div className="px-4 space-y-5">
          <NearbySection title="À proximité" businesses={nearbyBusinesses} />
          <RecommendedSection
            title="Recommandé pour vous"
            subtitle="Basé sur ce que vous consultez et enregistrez"
            source="home_for_you"
            loading={recLoading}
            items={recommended.map((r) => ({ business: r.business, reasonCodes: r.reasonCodes }))}
          />
          <RecommendedSection
            title="Tendance près de vous"
            subtitle="Les commerces dont on parle en ce moment"
            source="home_trending"
            loading={recLoading}
            showReasonChips={false}
            items={trending.slice(0, 4).map((b) => ({ business: b }))}
          />
          <FeaturedBusinesses businesses={businesses.slice(0, 3)} />
          <TrendingCollections />

          <div className="pt-1">
            <h2 className="font-heading text-lg font-bold text-foreground">Mieux notés</h2>
            <p className="text-xs text-muted-foreground">Les commerces qui performent le mieux actuellement</p>
          </div>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : (
            businesses.map((b) => (
              <BusinessCard
                key={b.id}
                business={mapBusinessToCard({ ...b, category_name: "Local" })}
              />
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
