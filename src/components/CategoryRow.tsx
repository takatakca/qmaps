import { useState } from "react";
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
import CategoryPickerDialog from "@/components/search/CategoryPickerDialog";

interface CuratedCategory {
  label: string;
  slug: string;
  Icon: LucideIcon;
  tint: string;
  iconColor: string;
}

/**
 * Curated homepage categories. All 1,132 categories remain accessible via
 * /services, search, the "Toutes les catégories" dialog, admin and merchant flows.
 */
const HOME_CATEGORIES: CuratedCategory[] = [
  { label: "Restaurants", slug: "restaurants", Icon: UtensilsCrossed, tint: "from-orange-500/15 to-red-500/10", iconColor: "text-orange-600" },
  { label: "Services pros", slug: "services-professionnels", Icon: Briefcase, tint: "from-blue-500/15 to-indigo-500/10", iconColor: "text-blue-600" },
  { label: "Nettoyage", slug: "cleaning", Icon: Sparkles, tint: "from-cyan-500/15 to-sky-500/10", iconColor: "text-cyan-600" },
  { label: "Électriciens", slug: "electricians", Icon: Zap, tint: "from-yellow-500/15 to-amber-500/10", iconColor: "text-amber-600" },
  { label: "Plomberie", slug: "plumbers", Icon: Wrench, tint: "from-blue-500/15 to-cyan-500/10", iconColor: "text-blue-600" },
  { label: "Construction", slug: "contractors", Icon: HardHat, tint: "from-orange-500/15 to-yellow-500/10", iconColor: "text-orange-600" },
  { label: "Beauté & spa", slug: "beaute-spa", Icon: Scissors, tint: "from-pink-500/15 to-rose-500/10", iconColor: "text-pink-600" },
  { label: "Santé", slug: "sante-medical", Icon: HeartPulse, tint: "from-emerald-500/15 to-green-500/10", iconColor: "text-emerald-600" },
  { label: "Comptables", slug: "services-professionnels--comptables", Icon: Calculator, tint: "from-emerald-500/15 to-teal-500/10", iconColor: "text-emerald-700" },
  { label: "Avocats", slug: "services-professionnels--avocats", Icon: Scale, tint: "from-indigo-500/15 to-blue-500/10", iconColor: "text-indigo-600" },
  { label: "Photographie", slug: "medias-marketing-creatif--photographes-commerciaux", Icon: Camera, tint: "from-violet-500/15 to-purple-500/10", iconColor: "text-violet-600" },
  { label: "Marketing", slug: "medias-marketing-creatif", Icon: Megaphone, tint: "from-fuchsia-500/15 to-pink-500/10", iconColor: "text-fuchsia-600" },
];

const CategoryRow = () => {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-heading text-sm font-semibold text-foreground">
          Catégories populaires
        </h2>
        <button
          onClick={() => setPickerOpen(true)}
          className="text-xs font-semibold text-primary hover:text-primary-glow transition-colors"
        >
          Toutes
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-1 -mx-1">
        {HOME_CATEGORIES.map(({ label, slug, Icon, tint, iconColor }) => (
          <button
            key={slug}
            onClick={() => navigate(`/search?category=${slug}`)}
            className="flex flex-col items-center gap-2 w-[78px] shrink-0 group focus:outline-none"
            aria-label={label}
          >
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tint} border border-border flex items-center justify-center shadow-soft group-hover:shadow-glow group-hover:border-primary/40 group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-ring transition-all duration-200`}
            >
              <Icon className={`w-7 h-7 ${iconColor}`} strokeWidth={1.75} />
            </div>
            <span className="text-[11px] leading-tight text-center text-foreground font-medium line-clamp-2 min-h-[26px] group-hover:text-primary transition-colors">
              {label}
            </span>
          </button>
        ))}
        <button
          onClick={() => setPickerOpen(true)}
          className="flex flex-col items-center gap-2 w-[78px] shrink-0 group focus:outline-none"
          aria-label="Toutes les catégories"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-soft group-hover:shadow-glow group-hover:-translate-y-0.5 transition-all duration-200">
            <LayoutGrid className="w-7 h-7 text-primary-foreground" strokeWidth={1.75} />
          </div>
          <span className="text-[11px] leading-tight text-center text-primary font-semibold line-clamp-2 min-h-[26px]">
            Toutes
          </span>
        </button>
      </div>
      <CategoryPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} />
    </div>
  );
};

export default CategoryRow;
