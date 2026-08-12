import restaurantImg from "@/assets/restaurant-1.jpg";
import foodImg from "@/assets/food-1.jpg";
import cafeImg from "@/assets/cafe-1.jpg";
import cleaningImg from "@/assets/cleaning.jpg";
import autoImg from "@/assets/auto-repair.jpg";
import salonImg from "@/assets/salon.jpg";
import electricienImg from "@/assets/cat-electricien.jpg";
import plomberieImg from "@/assets/cat-plomberie.jpg";
import constructionImg from "@/assets/cat-construction.jpg";
import santeImg from "@/assets/cat-sante.jpg";
import epicerieImg from "@/assets/cat-epicerie.jpg";
import pharmacieImg from "@/assets/cat-pharmacie.jpg";
import proImg from "@/assets/cat-pro.jpg";
import marketingImg from "@/assets/cat-marketing.jpg";

export const categoryImages = {
  restaurant: restaurantImg,
  food: foodImg,
  cafe: cafeImg,
  cleaning: cleaningImg,
  auto: autoImg,
  beaute: salonImg,
  electricien: electricienImg,
  plomberie: plomberieImg,
  construction: constructionImg,
  sante: santeImg,
  epicerie: epicerieImg,
  pharmacie: pharmacieImg,
  pro: proImg,
  marketing: marketingImg,
} as const;

export type CategoryImageKey = keyof typeof categoryImages;

/**
 * Editorial fallback artwork per category family. Used only when a real business
 * has no uploaded photo — it is illustrative context, never a fake listing.
 */
const IMAGE_MATCHERS: Array<{ match: RegExp; key: CategoryImageKey }> = [
  { match: /caf[eé]|p[aâ]tisser|boulanger|salon de th/i, key: "cafe" },
  { match: /restaur|poutin|bistro|traiteur|pizz|sushi|burger|brasserie|casse-cro/i, key: "restaurant" },
  { match: /[eé]picer|d[eé]panneur|march[eé]|alimentation|fruiterie|boucher/i, key: "epicerie" },
  { match: /pharmac/i, key: "pharmacie" },
  { match: /nettoy|m[eé]nage|entretien m[eé]nager|conciergerie/i, key: "cleaning" },
  { match: /[eé]lectric/i, key: "electricien" },
  { match: /plomb|chauffage|climatisation|drain/i, key: "plomberie" },
  { match: /construc|r[eé]nov|toiture|excavation|entrepreneur|ma[cç]onn/i, key: "construction" },
  { match: /auto|garage|m[eé]canic|pneu|carrosser/i, key: "auto" },
  { match: /beaut|coiff|esth[eé]t|spa|ongle|barbier/i, key: "beaute" },
  { match: /sant|clinique|dent|physio|m[eé]dic|optom|v[eé]t[eé]rin/i, key: "sante" },
  { match: /marketing|web|publicit|design|communicat|photograph|vid[eé]o|imprim/i, key: "marketing" },
  { match: /avocat|notaire|juridi|comptab|imp[oô]t|finance|assurance|consult|immobil|service/i, key: "pro" },
];

export const getCategoryImage = (...hints: Array<string | null | undefined>): string => {
  const text = hints.filter(Boolean).join(" ");
  return categoryImages[IMAGE_MATCHERS.find((m) => m.match.test(text))?.key ?? "pro"];
};
