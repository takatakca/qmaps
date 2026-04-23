import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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
}: SearchFiltersSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" className="max-w-lg rounded-t-[24px] px-4 pb-8">
      <SheetHeader className="pb-2 text-left">
        <SheetTitle>Filtres de recherche</SheetTitle>
        <SheetDescription>Affinez vos résultats QMaps par catégorie, prix, note et distance.</SheetDescription>
      </SheetHeader>

      <div className="space-y-5">
        <section>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Catégorie</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(selectedCategory === cat.slug ? "" : cat.slug)}
                className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                  selectedCategory === cat.slug ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"
                }`}
              >
                {cat.icon ? `${cat.icon} ` : ""}{cat.name}
              </button>
            ))}
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
                  selectedPrice.includes(index + 1) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"
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
                  minRating === rating ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"
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
                  radiusKm === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"
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

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1 rounded-full" onClick={onClearFilters}>Réinitialiser</Button>
          <Button className="flex-1 rounded-full" onClick={() => onOpenChange(false)}>Voir les résultats</Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
);

export default SearchFiltersSheet;