import { useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  Briefcase,
  Sparkles,
  Zap,
  Wrench,
  HardHat,
  Scissors,
  HeartPulse,
  Calculator,
  Scale,
  Camera,
  Megaphone,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

interface CuratedCategory {
  label: string;
  slug: string;
  Icon: LucideIcon;
}

/**
 * Curated, hand-picked categories surfaced on the homepage.
 * All 1,132 categories remain accessible via /services, search,
 * admin categories, and merchant onboarding.
 */
const HOME_CATEGORIES: CuratedCategory[] = [
  { label: "Restaurants", slug: "restaurants", Icon: UtensilsCrossed },
  { label: "Services pros", slug: "services-professionnels", Icon: Briefcase },
  { label: "Nettoyage", slug: "cleaning", Icon: Sparkles },
  { label: "Électriciens", slug: "electricians", Icon: Zap },
  { label: "Plomberie", slug: "plumbers", Icon: Wrench },
  { label: "Construction", slug: "contractors", Icon: HardHat },
  { label: "Beauté & spa", slug: "beaute-spa", Icon: Scissors },
  { label: "Santé", slug: "sante-medical", Icon: HeartPulse },
  { label: "Comptables", slug: "services-professionnels--comptables", Icon: Calculator },
  { label: "Avocats", slug: "services-professionnels--avocats", Icon: Scale },
  { label: "Photographie", slug: "medias-marketing-creatif--photographes-commerciaux", Icon: Camera },
  { label: "Marketing", slug: "medias-marketing-creatif", Icon: Megaphone },
];

const CategoryRow = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-heading text-sm font-semibold text-foreground">
          Catégories populaires
        </h2>
        <button
          onClick={() => navigate("/services")}
          className="text-xs font-semibold text-primary hover:text-primary-glow transition-colors"
        >
          Voir tout
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-1 -mx-1">
        {HOME_CATEGORIES.map(({ label, slug, Icon }) => (
          <button
            key={slug}
            onClick={() => navigate(`/search?category=${slug}`)}
            className="flex flex-col items-center gap-2 w-[78px] shrink-0 group focus:outline-none"
            aria-label={label}
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center shadow-soft group-hover:shadow-glow group-hover:border-primary/40 group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-ring transition-all duration-200">
              <Icon className="w-7 h-7 text-primary" strokeWidth={1.75} />
            </div>
            <span className="text-[11px] leading-tight text-center text-foreground font-medium line-clamp-2 min-h-[26px] group-hover:text-primary transition-colors">
              {label}
            </span>
          </button>
        ))}
        <button
          onClick={() => navigate("/services")}
          className="flex flex-col items-center gap-2 w-[78px] shrink-0 group focus:outline-none"
          aria-label="Tous les services"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-soft group-hover:shadow-glow group-hover:-translate-y-0.5 transition-all duration-200">
            <LayoutGrid className="w-7 h-7 text-primary-foreground" strokeWidth={1.75} />
          </div>
          <span className="text-[11px] leading-tight text-center text-primary font-semibold line-clamp-2 min-h-[26px]">
            Tous les services
          </span>
        </button>
      </div>
    </div>
  );
};

export default CategoryRow;
