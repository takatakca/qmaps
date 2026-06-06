import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search as SearchIcon } from "lucide-react";
import { normalizeSearchText } from "@/lib/searchFilters";

interface CategoryOption {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
}

interface SearchFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryOption[];
  selectedCategory: string;
  selectedPrice: number[];
  minRating: number | null;
  openNow: boolean;
  radiusKm: number;
  onCategoryChange: (slug: string) => void;
  onTogglePrice: (price: number) => void;
  onMinRatingChange: (rating: number | null) => void;
  onOpenNowChange: (value: boolean) => void;
  onRadiusChange: (value: number) => void;
  onClearFilters: () => void;
}

const priceLabels = ["$", "$$", "$$$", "$$$$"];
const ratingOptions = [3, 3.5, 4, 4.5];
const radiusOptions = [1, 3, 5, 10];

const SearchFiltersSheet = ({
  open,
  onOpenChange,
  categories,
  selectedCategory,
  selectedPrice,
  minRating,
  openNow,
  radiusKm,
  onCategoryChange,
  onTogglePrice,
  onMinRatingChange,
  onOpenNowChange,
  onRadiusChange,
  onClearFilters,
}: SearchFiltersSheetProps) => {
  const [catQuery, setCatQuery] = useState("");

  const filteredCategories = useMemo(() => {
    const q = normalizeSearchText(catQuery);
    if (!q) return categories.slice(0, 40);
    return categories
      .filter((c) => normalizeSearchText(c.name).includes(q) || normalizeSearchText(c.slug).includes(q))
      .slice(0, 60);
  }, [catQuery, categories]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-w-lg mx-auto rounded-t-[24px] p-0 flex flex-col max-h-[88vh]"
      >
        <SheetHeader className="px-5 pt-5 pb-3 text-left border-b border-border shrink-0">
          <SheetTitle>Filtres de recherche</SheetTitle>
          <SheetDescription>Affinez vos résultats QMaps par catégorie, prix, note et distance.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">Catégorie</h3>
              {selectedCategory && (
                <button
                  onClick={() => onCategoryChange("")}
                  className="text-xs text-primary font-medium"
                >
                  Effacer
                </button>
              )}
            </div>
            <div className="relative mb-2">
              <SearchIcon
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={catQuery}
                onChange={(e) => setCatQuery(e.target.value)}
                placeholder="Rechercher une catégorie…"
                className="pl-8 h-9 rounded-full text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(selectedCategory === cat.slug ? "" : cat.slug)}
                  className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                    selectedCategory === cat.slug
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  {cat.icon ? `${cat.icon} ` : ""}
                  {cat.name}
                </button>
              ))}
              {filteredCategories.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">Aucune catégorie.</p>
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Prix</h3>
            <div className="flex gap-2">
              {priceLabels.map((label, index) => (
                <button
                  key={label}
                  onClick={() => onTogglePrice(index + 1)}
                  className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                    selectedPrice.includes(index + 1)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Note minimale</h3>
            <div className="flex flex-wrap gap-2">
              {ratingOptions.map((rating) => (
                <button
                  key={rating}
                  onClick={() => onMinRatingChange(minRating === rating ? null : rating)}
                  className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                    minRating === rating
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  {rating}+ ⭐
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Distance</h3>
            <div className="flex gap-2">
              {radiusOptions.map((value) => (
                <button
                  key={value}
                  onClick={() => onRadiusChange(value)}
                  className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                    radiusKm === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  {value} km
                </button>
              ))}
            </div>
          </section>

          <section>
            <button
              onClick={() => onOpenNowChange(!openNow)}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                openNow ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-foreground"
              }`}
            >
              Ouvert maintenant
            </button>
          </section>
        </div>

        <div className="shrink-0 border-t border-border bg-background px-5 py-3 flex gap-3">
          <Button variant="outline" className="flex-1 rounded-full" onClick={onClearFilters}>
            Réinitialiser
          </Button>
          <Button className="flex-1 rounded-full" onClick={() => onOpenChange(false)}>
            Voir les résultats
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SearchFiltersSheet;
