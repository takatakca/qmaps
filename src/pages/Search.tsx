import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BusinessCard from "@/components/BusinessCard";
import BottomNav from "@/components/BottomNav";
import SearchBar from "@/components/SearchBar";
import SearchFiltersSheet from "@/components/search/SearchFiltersSheet";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNearbyBusinesses } from "@/hooks/useNearbyBusinesses";
import { formatDistance } from "@/lib/geo";
import { mapBusinessToCard } from "@/lib/business";
import type { Tables } from "@/integrations/supabase/types";

const priceLabels = ["$", "$$", "$$$", "$$$$"];
const ratingOptions = [3, 3.5, 4, 4.5];

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const categorySlug = searchParams.get("category") || "";

  const [businesses, setBusinesses] = useState<Tables<"businesses">[]>([]);
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState(categorySlug);
  const [selectedPrice, setSelectedPrice] = useState<number[]>([]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [openNow, setOpenNow] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const { businesses: nearbyBusinesses } = useNearbyBusinesses(12);

  useEffect(() => {
    supabase.from("categories").select("*").order("name").then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      let q = supabase.from("businesses").select("*");

      if (query) q = q.ilike("name", `%${query}%`);
      if (minRating) q = q.gte("avg_rating", minRating);
      if (selectedPrice.length > 0) q = q.in("price_level", selectedPrice);
      if (openNow) q = q.eq("is_open", true);

      // Category filter via business_categories pivot
      if (selectedCategory) {
        const cat = categories.find(c => c.slug === selectedCategory);
        if (cat) {
          const { data: bcData } = await supabase
            .from("business_categories")
            .select("business_id")
            .eq("category_id", cat.id);
          if (bcData && bcData.length > 0) {
            q = q.in("id", bcData.map(bc => bc.business_id));
          } else {
            setBusinesses([]);
            setLoading(false);
            return;
          }
        }
      }

      q = q.order("avg_rating", { ascending: false });
      const { data } = await q;
      const scopedResults = query || !nearbyBusinesses.length
        ? (data || [])
        : (data || []).filter((business) => {
            const nearby = nearbyBusinesses.find((item) => item.id === business.id);
            return !nearby || ((nearby.distance_meters || 0) <= radiusKm * 1000);
          });
      setBusinesses(scopedResults as Tables<"businesses">[]);
      setLoading(false);
    };
    fetchBusinesses();
  }, [query, selectedCategory, selectedPrice, minRating, openNow, radiusKm, categories, nearbyBusinesses]);

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedPrice([]);
    setMinRating(null);
    setOpenNow(false);
    setRadiusKm(5);
  };

  const togglePrice = (p: number) => {
    setSelectedPrice(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const activeFiltersCount = (selectedCategory ? 1 : 0) + (selectedPrice.length > 0 ? 1 : 0) + (minRating ? 1 : 0) + (openNow ? 1 : 0) + (radiusKm !== 5 ? 1 : 0);

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-4">
        <SearchBar initialValue={query} />

        {/* Filter toggle */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            size="sm"
            variant={showFilters ? "default" : "outline"}
            className="rounded-full gap-1.5 text-xs"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={14} />
            Filtres {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>

          {/* Category chips */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {categories.slice(0, 6).map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.slug ? "" : cat.slug)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                  selectedCategory === cat.slug
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border"
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-3 p-4 bg-card rounded-xl border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-foreground text-sm">Filtres</h3>
              <button onClick={clearFilters} className="text-xs text-primary">Réinitialiser</button>
            </div>

            {/* Price */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Prix</p>
              <div className="flex gap-2">
                {priceLabels.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => togglePrice(i + 1)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selectedPrice.includes(i + 1)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Évaluation minimum</p>
              <div className="flex gap-2">
                {ratingOptions.map(r => (
                  <button
                    key={r}
                    onClick={() => setMinRating(minRating === r ? null : r)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      minRating === r
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border"
                    }`}
                  >
                    {r}+ ⭐
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setOpenNow(!openNow)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  openNow ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
                }`}
              >
                Ouvert maintenant
              </button>
              <button className="px-3 py-1.5 rounded-full text-xs font-medium border bg-card text-foreground border-border">
                Rayon {radiusKm} km
              </button>
            </div>
          </div>
        )}

        <SearchFiltersSheet
          open={showFilters}
          onOpenChange={setShowFilters}
          categories={categories}
          selectedCategory={selectedCategory}
          selectedPrice={selectedPrice}
          minRating={minRating}
          openNow={openNow}
          radiusKm={radiusKm}
          onCategoryChange={setSelectedCategory}
          onTogglePrice={togglePrice}
          onMinRatingChange={setMinRating}
          onOpenNowChange={setOpenNow}
          onRadiusChange={setRadiusKm}
          onClearFilters={clearFilters}
        />

        {/* Results */}
        <div className="mt-4">
          {query && (
            <p className="text-sm text-muted-foreground mb-3">
              {loading ? "Recherche..." : `${businesses.length} résultat${businesses.length !== 1 ? "s" : ""} pour "${query}"`}
            </p>
          )}

          <div className="space-y-4">
            {businesses.map(b => (
              <BusinessCard key={b.id} business={mapBusinessToCard({
                ...b,
                category_name: categories.find(cat => cat.slug === selectedCategory)?.name || "Local",
                distance_meters: nearbyBusinesses.find(item => item.id === b.id)?.distance_meters,
              })} />
            ))}

            {!query && nearbyBusinesses.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground">Autour de vous</p>
                <div className="mt-3 space-y-2">
                  {nearbyBusinesses.slice(0, 4).map((business) => (
                    <div key={business.id} className="flex items-center justify-between text-sm">
                      <span className="truncate text-foreground">{business.name}</span>
                      <span className="text-xs text-muted-foreground">{formatDistance(business.distance_meters)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && businesses.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Aucun résultat trouvé</p>
                {activeFiltersCount > 0 && (
                  <Button variant="link" onClick={clearFilters} className="mt-2 text-primary">
                    <X size={14} className="mr-1" /> Effacer les filtres
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Search;
