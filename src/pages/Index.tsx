import BottomNav from "@/components/BottomNav";
import HeroSection from "@/components/home/HeroSection";
import CategoryShowcase from "@/components/home/CategoryShowcase";
import BusinessListingRow from "@/components/home/BusinessListingRow";
import StartProjectCTA from "@/components/home/StartProjectCTA";
import MerchantBanner from "@/components/home/MerchantBanner";
import SponsoredListings from "@/components/sponsored/SponsoredListings";
import RecommendedSection from "@/components/recommendations/RecommendedSection";
import { useRecommendedBusinesses } from "@/hooks/useRecommendedBusinesses";
import { useNearbyBusinesses } from "@/hooks/useNearbyBusinesses";
import { useHomeListings, type HomeListing } from "@/hooks/useHomeListings";
import { useLang } from "@/i18n/language";
import { categoryImages } from "@/lib/categoryImages";
import Seo from "@/components/Seo";

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
  const { t } = useLang();
  const listings = useHomeListings(10);
  const { businesses: nearbyBusinesses } = useNearbyBusinesses(6);
  const { recommended, trending, loading: recLoading } = useRecommendedBusinesses({ limit: 5 });

  return (
    <div className="min-h-screen bg-background pb-24">
      <Seo
        title="QMaps Québec — Commerces, services et pros locaux"
        description="Découvrez les meilleurs commerces, restaurants et professionnels du Québec avec QMaps."
        canonicalPath="/"
      />

      <HeroSection />

      <main className="mx-auto w-full max-w-6xl space-y-12 px-5 pt-10 sm:px-8 md:space-y-16 md:pt-14">
        <CategoryShowcase />

        {/* Real listings — every card below is backed by public.businesses */}
        <BusinessListingRow
          eyebrow="Autour de vous"
          title={t("nearby")}
          subtitle={nearbyBusinesses.length ? t("nearbySubGeo") : t("nearbySubNoGeo")}
          businesses={nearbyBusinesses as unknown as HomeListing[]}
          fallbackShortcuts={NEARBY_HINTS}
          fallbackTitle="Explorer par ville"
          fallbackImage={categoryImages.pro}
          emptyMessage="Partagez votre position ou explorez par ville pour découvrir les entreprises près de chez vous."
        />

        <BusinessListingRow
          eyebrow="Gastronomie"
          title={t("restaurants")}
          subtitle={t("restaurantsSub")}
          businesses={listings.restaurants}
          loading={listings.loading}
          seeAllHref="/search?q=restaurants"
          fallbackShortcuts={RESTAURANT_SHORTCUTS}
          fallbackImage={categoryImages.restaurant}
          emptyMessage="Les premiers restaurants du Québec arrivent bientôt sur QMaps — explorez les catégories en attendant."
        />

        <BusinessListingRow
          eyebrow="Tendance"
          title={t("popular")}
          subtitle={t("popularSub")}
          businesses={listings.popular}
          loading={listings.loading}
          seeAllHref="/search"
          fallbackShortcuts={POPULAR_SERVICES}
          fallbackImage={categoryImages.marketing}
          emptyMessage="Aucune entreprise populaire à afficher pour l'instant."
        />

        <BusinessListingRow
          eyebrow="Experts locaux"
          title={t("services")}
          subtitle={t("servicesSub")}
          businesses={listings.services}
          loading={listings.loading}
          seeAllHref="/services"
          fallbackShortcuts={POPULAR_SERVICES}
          fallbackImage={categoryImages.electricien}
          emptyMessage="Aucun pro inscrit dans ces services pour l'instant — soyez le premier."
        />

        <StartProjectCTA />

        <BusinessListingRow
          eyebrow="Nouveau sur QMaps"
          title={t("recent")}
          subtitle={t("recentSub")}
          businesses={listings.recent}
          loading={listings.loading}
          fallbackShortcuts={PROS_RECOMMENDED}
          fallbackImage={categoryImages.construction}
          emptyMessage="Aucune nouvelle entreprise inscrite cette semaine."
        />

        <BusinessListingRow
          eyebrow="Essentiels"
          title={t("essentials")}
          subtitle={t("essentialsSub")}
          businesses={listings.essentials}
          loading={listings.loading}
          fallbackShortcuts={ESSENTIALS}
          fallbackImage={categoryImages.epicerie}
          emptyMessage="Épiceries, pharmacies et dépanneurs seront listés ici dès leur inscription."
        />

        <MerchantBanner />

        <SponsoredListings placement="home" />

        {/* Personalized real-data feed */}
        <div className="space-y-8">
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
          {listings.error && (
            <p className="text-center text-xs text-destructive">{listings.error}</p>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
