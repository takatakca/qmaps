import { useSyncExternalStore } from "react";

export type Lang = "fr" | "en" | "es";

const KEY = "qmaps.lang";
let current: Lang = (typeof localStorage !== "undefined" && (localStorage.getItem(KEY) as Lang)) || "fr";
const listeners = new Set<() => void>();

export const setLang = (lang: Lang) => {
  current = lang;
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* storage unavailable */
  }
  if (typeof document !== "undefined") document.documentElement.lang = lang === "fr" ? "fr-CA" : lang;
  listeners.forEach((l) => l());
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

type Dict = Record<string, string>;

const strings: Record<Lang, Dict> = {
  fr: {
    heroTitle: "Découvrez le meilleur du",
    heroSub: "Commerces locaux, avis honnêtes et pros de confiance — près de chez vous.",
    searchNote: "Trouvez les meilleurs commerces, services et professionnels du Québec.",
    exploreServices: "Explorer par service",
    exploreServicesSub: "Les catégories les plus recherchées au Québec.",
    seeAllServices: "Voir tous les services",
    restaurants: "Meilleurs restaurants près de vous",
    restaurantsSub: "Restaurants, cafés et bistros inscrits sur QMaps.",
    popular: "Entreprises populaires au Québec",
    popularSub: "Les fiches les mieux notées de la plateforme.",
    services: "Services professionnels",
    servicesSub: "Pros vérifiés : construction, nettoyage, auto, santé, droit et plus.",
    recent: "Nouveaux sur QMaps",
    recentSub: "Les entreprises inscrites récemment.",
    essentials: "Épicerie, restaurants et essentiels",
    essentialsSub: "Le quotidien, près de chez vous.",
    nearby: "À proximité",
    nearbySubGeo: "Entreprises réelles autour de votre position.",
    nearbySubNoGeo: "Position non partagée — explorez par ville du Québec.",
    language: "Langue",
    signIn: "Connexion",
  },
  en: {
    heroTitle: "Discover the best of",
    heroSub: "Local businesses, honest reviews and trusted pros — close to you.",
    searchNote: "Find the best businesses, services and professionals in Québec.",
    exploreServices: "Explore by service",
    exploreServicesSub: "The most searched categories in Québec.",
    seeAllServices: "See all services",
    restaurants: "Top restaurants near you",
    restaurantsSub: "Restaurants, cafés and bistros listed on QMaps.",
    popular: "Popular businesses in Québec",
    popularSub: "The highest rated listings on the platform.",
    services: "Professional services",
    servicesSub: "Verified pros: construction, cleaning, auto, health, legal and more.",
    recent: "New on QMaps",
    recentSub: "Recently registered businesses.",
    essentials: "Groceries, restaurants and essentials",
    essentialsSub: "Everyday needs, close to home.",
    nearby: "Nearby",
    nearbySubGeo: "Real businesses around your location.",
    nearbySubNoGeo: "Location not shared — browse by Québec city.",
    language: "Language",
    signIn: "Sign in",
  },
  es: {
    heroTitle: "Descubre lo mejor de",
    heroSub: "Negocios locales, reseñas honestas y profesionales de confianza cerca de ti.",
    searchNote: "Encuentra los mejores negocios, servicios y profesionales de Quebec.",
    exploreServices: "Explorar por servicio",
    exploreServicesSub: "Las categorías más buscadas en Quebec.",
    seeAllServices: "Ver todos los servicios",
    restaurants: "Mejores restaurantes cerca de ti",
    restaurantsSub: "Restaurantes, cafés y bistrós registrados en QMaps.",
    popular: "Negocios populares en Quebec",
    popularSub: "Las fichas mejor calificadas de la plataforma.",
    services: "Servicios profesionales",
    servicesSub: "Profesionales verificados: construcción, limpieza, auto, salud, legal y más.",
    recent: "Nuevos en QMaps",
    recentSub: "Negocios registrados recientemente.",
    essentials: "Supermercado, restaurantes y esenciales",
    essentialsSub: "Lo cotidiano, cerca de ti.",
    nearby: "Cerca de ti",
    nearbySubGeo: "Negocios reales alrededor de tu ubicación.",
    nearbySubNoGeo: "Ubicación no compartida — explora por ciudad de Quebec.",
    language: "Idioma",
    signIn: "Iniciar sesión",
  },
};

export const LANGUAGES: Array<{ code: Lang; label: string; flag: string }> = [
  { code: "fr", label: "Français", flag: "🇨🇦" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

export const useLang = () => {
  const lang = useSyncExternalStore(subscribe, () => current, () => "fr" as Lang);
  const t = (key: keyof typeof strings.fr | string) => strings[lang][key] ?? strings.fr[key] ?? key;
  return { lang, setLang, t };
};
