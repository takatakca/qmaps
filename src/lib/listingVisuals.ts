import {
  UtensilsCrossed, Coffee, ShoppingBasket, Pill, Sparkles, Zap, Wrench,
  HardHat, Car, Scissors, HeartPulse, Scale, Calculator, Megaphone,
  Store, Building2, type LucideIcon,
} from "lucide-react";

export interface ListingVisual {
  icon: LucideIcon;
  gradient: string;
  iconClass: string;
}

const VISUALS: Array<{ match: RegExp; visual: ListingVisual }> = [
  { match: /restaur|poutin|bistro|traiteur|pizz|sushi|burger/i, visual: { icon: UtensilsCrossed, gradient: "from-orange-500/25 via-orange-500/10 to-transparent", iconClass: "text-orange-600" } },
  { match: /caf[eé]|p[aâ]tisser|boulanger|salon de th/i, visual: { icon: Coffee, gradient: "from-amber-500/25 via-amber-500/10 to-transparent", iconClass: "text-amber-600" } },
  { match: /[eé]picer|d[eé]panneur|march[eé]|alimentation/i, visual: { icon: ShoppingBasket, gradient: "from-green-500/25 via-green-500/10 to-transparent", iconClass: "text-green-600" } },
  { match: /pharmac/i, visual: { icon: Pill, gradient: "from-emerald-500/25 via-emerald-500/10 to-transparent", iconClass: "text-emerald-600" } },
  { match: /nettoy|m[eé]nage|entretien/i, visual: { icon: Sparkles, gradient: "from-cyan-500/25 via-cyan-500/10 to-transparent", iconClass: "text-cyan-600" } },
  { match: /[eé]lectric/i, visual: { icon: Zap, gradient: "from-yellow-500/25 via-yellow-500/10 to-transparent", iconClass: "text-yellow-600" } },
  { match: /plomb|chauffage|r[eé]paration/i, visual: { icon: Wrench, gradient: "from-blue-500/25 via-blue-500/10 to-transparent", iconClass: "text-blue-600" } },
  { match: /construc|r[eé]nov|toiture|excavation/i, visual: { icon: HardHat, gradient: "from-orange-600/25 via-orange-600/10 to-transparent", iconClass: "text-orange-700" } },
  { match: /auto|garage|m[eé]canic|pneu/i, visual: { icon: Car, gradient: "from-slate-500/25 via-slate-500/10 to-transparent", iconClass: "text-slate-600" } },
  { match: /beaut|salon|coiff|esth[eé]t|spa|ongle/i, visual: { icon: Scissors, gradient: "from-pink-500/25 via-pink-500/10 to-transparent", iconClass: "text-pink-600" } },
  { match: /sant|clinique|dent|physio|m[eé]dic/i, visual: { icon: HeartPulse, gradient: "from-rose-500/25 via-rose-500/10 to-transparent", iconClass: "text-rose-600" } },
  { match: /avocat|notaire|juridi|droit/i, visual: { icon: Scale, gradient: "from-indigo-500/25 via-indigo-500/10 to-transparent", iconClass: "text-indigo-600" } },
  { match: /comptab|imp[oô]t|finance|fiscal/i, visual: { icon: Calculator, gradient: "from-teal-500/25 via-teal-500/10 to-transparent", iconClass: "text-teal-600" } },
  { match: /marketing|web|publicit|design|communicat/i, visual: { icon: Megaphone, gradient: "from-fuchsia-500/25 via-fuchsia-500/10 to-transparent", iconClass: "text-fuchsia-600" } },
  { match: /boutique|commerce|magasin|d[eé]tail/i, visual: { icon: Store, gradient: "from-violet-500/25 via-violet-500/10 to-transparent", iconClass: "text-violet-600" } },
];

const DEFAULT_VISUAL: ListingVisual = {
  icon: Building2,
  gradient: "from-primary/25 via-primary/10 to-transparent",
  iconClass: "text-primary",
};

/** Category-based fallback visual used when a business has no real photo. */
export const getListingVisual = (...hints: Array<string | null | undefined>): ListingVisual => {
  const text = hints.filter(Boolean).join(" ");
  return VISUALS.find((v) => v.match.test(text))?.visual ?? DEFAULT_VISUAL;
};

/** First real image for a business: photos -> cover/logo (image_url). Never a stock placeholder. */
export const getListingImage = (business: {
  photos?: string[] | null;
  image_url?: string | null;
}): string | null => {
  const photo = (business.photos ?? []).find((p) => typeof p === "string" && p.trim().length > 0);
  if (photo) return photo;
  const cover = business.image_url?.trim();
  return cover ? cover : null;
};
