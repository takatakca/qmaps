import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { directoryPages, type DirectoryPlace } from "@/lib/ownedDirectory";
import BusinessCard from "@/components/BusinessCard";
import BottomNav from "@/components/BottomNav";
import SearchBar from "@/components/SearchBar";
import SearchFiltersSheet from "@/components/search/SearchFiltersSheet";
import CategoryPickerDialog from "@/components/search/CategoryPickerDialog";
import { SlidersHorizontal, X, LayoutGrid, FilePlus2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { distanceMeters, getCurrentPosition, type Coordinates } from "@/lib/geo";
import { cityLabelFor } from "@/lib/localSearch";
import { categoryNameFromEmbed, mapBusinessToCard } from "@/lib/business";
import { trackRecommendationEvent } from "@/hooks/useRecommendationEvents";
import Seo from "@/components/Seo";
import {
  sortBusinesses,
  SORT_OPTIONS,
  type SortOption,
  isBusinessOpenNow,
  matchesAmenityFilter,
  serviceFilters,
  normalizeSearchText,
} from "@/lib/searchFilters";
import { useAllCategories, searchCategories } from "@/hooks/useAllCategories";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const city = cityLabelFor(searchParams.get("city") || "");
  const services = useMemo(() => {
    const selected = searchParams.getAll("service");
    return serviceFilters.map(option => option.key).filter(key => selected.includes(key));
  }, [searchParams]);
  const selectedCategory = searchParams.get("category") || "";

  const [businesses, setBusinesses] = useState<DirectoryPlace[]>([]);
  const [searchError, setSearchError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Filters (initialized from URL)
  const [selectedPrice, setSelectedPrice] = useState<number[]>([]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [openNow, setOpenNow] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [position, setPosition] = useState<Coordinates | null>(null);
  const { categories, loading: categoriesLoading, error: categoryError, retry: retryCategories } = useAllCategories();

  useEffect(() => {
    let active = true;
    getCurrentPosition().then(value => { if (active) setPosition(value); }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let current = true;
    const controller = new AbortController();
    setLoading(true);
    setSearchError(false);
    setBusinesses([]);
    const load = async () => {
      if (categoriesLoading && (selectedCategory || query)) return;
      if (categoryError && (selectedCategory || query)) throw new Error("Catégories indisponibles");
      const matched = selectedCategory
        ? categories.filter(c => c.slug === selectedCategory)
        : searchCategories(categories, query, 4);
      if (selectedCategory && !matched.length) {
        setLoading(false);
        return;
      }
      const filters = new URLSearchParams({ q: query, city });
      if (selectedCategory) filters.set("category", selectedCategory);
      else for (const category of matched) filters.append("match", category.id);
      for (const price of selectedPrice) filters.append("price", String(price));
      if (minRating) filters.set("rating", String(minRating));
      const rows = await directoryPages<DirectoryPlace>("", filters, controller.signal);
      if (current) {
        setBusinesses(rows);
        setLoading(false);
      }
    };
    void load().catch(() => {
      if (current) { setSearchError(true); setLoading(false); }
    });
    return () => { current = false; controller.abort(); };
  }, [query, city, selectedCategory, selectedPrice, minRating, categories, categoriesLoading, categoryError, attempt]);

  const results = useMemo(() => {
    const rows = businesses.map(b => ({
      ...b,
      distance_meters: position ? distanceMeters(position, b.latitude, b.longitude) : undefined,
    })).filter(b =>
      matchesAmenityFilter(b, services) &&
      (!openNow || isBusinessOpenNow(b)) &&
      (radiusKm === null || (b.distance_meters != null && b.distance_meters <= radiusKm * 1000))
    );
    return sortBusinesses(rows, sortBy);
  }, [businesses, position, openNow, radiusKm, sortBy, services]);

  const clearFilters = () => {
    setSelectedPrice([]);
    setMinRating(null);
    setOpenNow(false);
    setRadiusKm(null);
    // Also clear URL category param so refresh keeps cleared state
    const next = new URLSearchParams(searchParams);
    next.delete("category");
    next.delete("service");
    setSearchParams(next, { replace: true });
  };

  const togglePrice = (p: number) => {
    setSelectedPrice((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const handleCategoryChange = (slug: string) => {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set("category", slug);
    else next.delete("category");
    setSearchParams(next, { replace: true });
  };

  const toggleService = (key: string) => {
    const next = new URLSearchParams(searchParams);
    if (next.getAll("service").includes(key)) next.delete("service", key);
    else next.append("service", key);
    setSearchParams(next, { replace: true });
  };

  const activeFiltersCount =
    services.length +
    (selectedCategory ? 1 : 0) +
    (selectedPrice.length > 0 ? 1 : 0) +
    (minRating ? 1 : 0) +
    (openNow ? 1 : 0) +
    (radiusKm !== null ? 1 : 0);

  // Related suggestions for no-results state
  const relatedSuggestions = useMemo(() => {
    if (!categories.length) return [];
    const seed = query || selectedCategory;
    if (!seed) return [];
    return searchCategories(categories, normalizeSearchText(seed), 6).filter(
      (c) => c.slug !== selectedCategory,
    );
  }, [categories, query, selectedCategory]);

  const selectedCategoryName =
    categories.find((c) => c.slug === selectedCategory)?.name;

  return (
    <div className="min-h-screen bg-background pb-20 max-w-5xl mx-auto">
      <Seo
        title={query ? `Recherche : ${query} — QMaps` : "Recherche de commerces — QMaps"}
        description={
          query
            ? `Résultats pour « ${query} » sur QMaps.`
            : "Recherchez des commerces, restaurants et services locaux au Québec."
        }
        canonicalPath="/search"
        noindex
      />
      <div className="px-4 pt-4">
        <SearchBar
          initialValue={query}
          initialCity={city}
          initialCategory={selectedCategory}
          smart
          onOpenAllCategories={() => setShowCategoryPicker(true)}
        />

        {/* Action row */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
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
          services={services}
          onToggleService={toggleService}
          openNow={openNow}
          radiusKm={radiusKm}
          hasPosition={!!position}
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
                : searchError ? "Recherche indisponible" : `${results.length} résultat${results.length !== 1 ? "s" : ""}${query ? ` pour "${query}"` : ""}${city ? ` à ${city}` : ""}`}
            </p>
            <select
              aria-label="Trier les résultats"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs bg-card border border-border rounded-full px-3 py-1.5 text-foreground"
            >
              {SORT_OPTIONS.filter(o => o.id !== "distance" || position).map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((b) => (
              <div
                key={b.id}
                onClick={(event) => {
                  if (!(event.target instanceof Element) || !event.target.closest("a")) return;
                  trackRecommendationEvent({
                    business_id: b.id,
                    event_type: "search_click",
                    source: "search_results",
                    city: b.city ?? null,
                    metadata: { query, category: selectedCategory || null, sort: sortBy },
                  });
                }}
              >
                <BusinessCard business={mapBusinessToCard({
                  ...b,
                  category_name: categoryNameFromEmbed(b, selectedCategoryName || "Commerce"),
                })} />
              </div>
            ))}

            {searchError && <div role="alert" className="col-span-full rounded-xl border p-4">
              Impossible de charger les résultats. <Button variant="outline" onClick={() => {
                if (categoryError) retryCategories();
                setAttempt(value => value + 1);
              }}>Réessayer</Button>
            </div>}
            {!loading && !searchError && results.length === 0 && (
              <div className="col-span-full rounded-2xl border border-border bg-card p-6 space-y-5">
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
