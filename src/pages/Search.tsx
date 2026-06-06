import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BusinessCard from "@/components/BusinessCard";
import BottomNav from "@/components/BottomNav";
import SearchBar from "@/components/SearchBar";
import SearchFiltersSheet from "@/components/search/SearchFiltersSheet";
import CategoryPickerDialog from "@/components/search/CategoryPickerDialog";
import { SlidersHorizontal, X, LayoutGrid, FilePlus2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNearbyBusinesses } from "@/hooks/useNearbyBusinesses";
import { formatDistance } from "@/lib/geo";
import { mapBusinessToCard } from "@/lib/business";
import { trackRecommendationEvent } from "@/hooks/useRecommendationEvents";
import Seo from "@/components/Seo";
import {
  sortBusinesses,
  SORT_OPTIONS,
  type SortOption,
  isBusinessOpenNow,
  normalizeSearchText,
} from "@/lib/searchFilters";
import { useAllCategories, searchCategories } from "@/hooks/useAllCategories";
import type { Tables } from "@/integrations/supabase/types";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const categorySlug = searchParams.get("category") || "";

  const [businesses, setBusinesses] = useState<Tables<"businesses">[]>([]);
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Filters (initialized from URL)
  const [selectedCategory, setSelectedCategory] = useState(categorySlug);
  const [selectedPrice, setSelectedPrice] = useState<number[]>([]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [openNow, setOpenNow] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const { businesses: nearbyBusinesses } = useNearbyBusinesses(12);
  const { categories: allCategories } = useAllCategories();

  // Keep selectedCategory in sync if URL changes
  useEffect(() => {
    setSelectedCategory(categorySlug);
  }, [categorySlug]);

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

      if (selectedCategory) {
        const cat = (categories.length ? categories : []).find((c) => c.slug === selectedCategory)
          ?? allCategories.find((c) => c.slug === selectedCategory);
        if (cat) {
          const { data: bcData } = await supabase
            .from("business_categories")
            .select("business_id")
            .eq("category_id", cat.id);
          if (bcData && bcData.length > 0) {
            q = q.in("id", bcData.map((bc) => bc.business_id));
          } else {
            setBusinesses([]);
            setLoading(false);
            return;
          }
        }
      }

      q = q.order("avg_rating", { ascending: false });
      const { data } = await q;
      let results = data || [];

      // Client-side openNow using real hours when available
      if (openNow) {
        results = results.filter((b) => isBusinessOpenNow(b as any));
      }

      // Distance scoping
      const scoped = query || !nearbyBusinesses.length
        ? results
        : results.filter((business) => {
            const nearby = nearbyBusinesses.find((item) => item.id === business.id);
            return !nearby || ((nearby.distance_meters || 0) <= radiusKm * 1000);
          });
      setBusinesses(scoped as Tables<"businesses">[]);
      setLoading(false);
    };
    fetchBusinesses();
  }, [query, selectedCategory, selectedPrice, minRating, openNow, radiusKm, categories, allCategories, nearbyBusinesses]);

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedPrice([]);
    setMinRating(null);
    setOpenNow(false);
    setRadiusKm(5);
    // Also clear URL category param so refresh keeps cleared state
    const next = new URLSearchParams(searchParams);
    next.delete("category");
    setSearchParams(next, { replace: true });
  };

  const togglePrice = (p: number) => {
    setSelectedPrice((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    const next = new URLSearchParams(searchParams);
    if (slug) next.set("category", slug);
    else next.delete("category");
    setSearchParams(next, { replace: true });
  };

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (selectedPrice.length > 0 ? 1 : 0) +
    (minRating ? 1 : 0) +
    (openNow ? 1 : 0) +
    (radiusKm !== 5 ? 1 : 0);

  // Related suggestions for no-results state
  const relatedSuggestions = useMemo(() => {
    if (!allCategories.length) return [];
    const seed = query || selectedCategory;
    if (!seed) return [];
    return searchCategories(allCategories, normalizeSearchText(seed), 6).filter(
      (c) => c.slug !== selectedCategory,
    );
  }, [allCategories, query, selectedCategory]);

  const selectedCategoryName =
    categories.find((c) => c.slug === selectedCategory)?.name ||
    allCategories.find((c) => c.slug === selectedCategory)?.name;

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <Seo
        title={query ? `Recherche : ${query} — QMaps` : "Recherche de commerces — QMaps"}
        description={
          query
            ? `Résultats pour « ${query} » sur QMaps Montréal.`
            : "Recherchez des commerces, restaurants et services locaux à Montréal."
        }
        canonicalPath="/search"
      />
      <div className="px-4 pt-4">
        <SearchBar
          initialValue={query}
          smart
          onOpenAllCategories={() => setShowCategoryPicker(true)}
        />

        {/* Action row */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            size="sm"
            variant={activeFiltersCount > 0 ? "default" : "outline"}
            className="rounded-full gap-1.5 text-xs"
            onClick={() => setShowFilters(true)}
          >
            <SlidersHorizontal size={14} />
            Filtres {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-1.5 text-xs"
            onClick={() => setShowCategoryPicker(true)}
          >
            <LayoutGrid size={14} />
            Toutes les catégories
          </Button>

          {selectedCategoryName && (
            <button
              onClick={() => handleCategoryChange("")}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground"
            >
              {selectedCategoryName}
              <X size={12} />
            </button>
          )}
        </div>

        <SearchFiltersSheet
          open={showFilters}
          onOpenChange={setShowFilters}
          categories={categories}
          selectedCategory={selectedCategory}
          selectedPrice={selectedPrice}
          minRating={minRating}
          openNow={openNow}
          radiusKm={radiusKm}
          onCategoryChange={handleCategoryChange}
          onTogglePrice={togglePrice}
          onMinRatingChange={setMinRating}
          onOpenNowChange={setOpenNow}
          onRadiusChange={setRadiusKm}
          onClearFilters={clearFilters}
        />

        <CategoryPickerDialog
          open={showCategoryPicker}
          onOpenChange={setShowCategoryPicker}
          onSelect={(slug) => handleCategoryChange(slug)}
        />

        {/* Results */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3 gap-2">
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Recherche..."
                : `${businesses.length} résultat${businesses.length !== 1 ? "s" : ""}${query ? ` pour "${query}"` : ""}`}
            </p>
            <select
              aria-label="Trier les résultats"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs bg-card border border-border rounded-full px-3 py-1.5 text-foreground"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {sortBusinesses(
              businesses.map((b) => ({
                ...b,
                distance_meters: nearbyBusinesses.find((item) => item.id === b.id)?.distance_meters,
              })) as (Tables<"businesses"> & { distance_meters?: number })[],
              sortBy,
            ).map((b) => (
              <div
                key={b.id}
                onMouseDown={() => trackRecommendationEvent({
                  business_id: b.id,
                  event_type: "search_click",
                  source: "search_results",
                  city: b.city ?? null,
                  metadata: { query, category: selectedCategory || null, sort: sortBy },
                })}
              >
                <BusinessCard business={mapBusinessToCard({
                  ...b,
                  category_name: categories.find((cat) => cat.slug === selectedCategory)?.name || "Local",
                  distance_meters: (b as any).distance_meters,
                })} />
              </div>
            ))}

            {!query && !selectedCategory && nearbyBusinesses.length > 0 && (
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
              <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
                <div className="text-center">
                  <p className="font-heading text-base font-semibold text-foreground">
                    Aucun résultat trouvé
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {query
                      ? `Aucune entreprise ne correspond à « ${query} » pour l'instant.`
                      : "Aucun résultat avec ces filtres."}
                  </p>
                </div>

                {activeFiltersCount > 0 && (
                  <div className="flex justify-center">
                    <Button variant="outline" size="sm" onClick={clearFilters} className="rounded-full gap-1">
                      <X size={14} /> Effacer les filtres
                    </Button>
                  </div>
                )}

                {relatedSuggestions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Catégories suggérées
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {relatedSuggestions.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleCategoryChange(c.slug)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-card hover:border-primary/40 hover:text-primary transition-colors"
                        >
                          {c.icon ? `${c.icon} ` : ""}
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-2 pt-1">
                  <Link
                    to="/projects/new"
                    className="rounded-xl border border-border p-3 hover:border-primary/40 hover:bg-accent transition-colors flex items-start gap-2"
                  >
                    <FilePlus2 size={18} className="text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Démarrer un projet</p>
                      <p className="text-xs text-muted-foreground">Décrivez votre besoin, recevez des devis.</p>
                    </div>
                  </Link>
                  <Link
                    to="/merchant/onboarding"
                    className="rounded-xl border border-border p-3 hover:border-primary/40 hover:bg-accent transition-colors flex items-start gap-2"
                  >
                    <Store size={18} className="text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Enregistrer une entreprise</p>
                      <p className="text-xs text-muted-foreground">Soyez le premier {query ? `pour « ${query} »` : "dans cette catégorie"}.</p>
                    </div>
                  </Link>
                </div>
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
