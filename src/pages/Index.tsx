import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import SearchBar from "@/components/SearchBar";
import CategoryRow from "@/components/CategoryRow";
import BusinessCard from "@/components/BusinessCard";
import BottomNav from "@/components/BottomNav";
import NearbySection from "@/components/home/NearbySection";
import FeaturedBusinesses from "@/components/home/FeaturedBusinesses";
import TrendingCollections from "@/components/home/TrendingCollections";
import SponsoredListings from "@/components/sponsored/SponsoredListings";
import RecommendedSection from "@/components/recommendations/RecommendedSection";
import { useRecommendedBusinesses } from "@/hooks/useRecommendedBusinesses";
import { useNearbyBusinesses } from "@/hooks/useNearbyBusinesses";
import { mapBusinessToCard } from "@/lib/business";
import Seo from "@/components/Seo";
import type { Tables } from "@/integrations/supabase/types";

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
        title="QMaps Montréal — Commerces, avis et pros locaux"
        description="Découvrez des commerces, lisez des avis et trouvez des pros locaux à Montréal avec QMaps."
        canonicalPath="/"
      />
      {/* Header */}
      <header className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">
            Q<span className="text-primary">Maps</span>
          </h1>
          <a
            href="/city/montreal"
            className="text-xs text-muted-foreground font-medium bg-secondary px-2 py-1 rounded-full hover:bg-accent transition-colors"
          >
            📍 Montréal
          </a>
        </div>
        <SearchBar />
      </header>

      {/* Categories */}
      <main>
      <div className="px-4 mt-3">
        <CategoryRow />
      </div>

      <SponsoredListings placement="home" />

      {/* Feed */}
      <div className="px-4 mt-4 space-y-4">
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

        <div className="pt-2">
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

      <BottomNav />
    </div>
  );
};

export default Index;
