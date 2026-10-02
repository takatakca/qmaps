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
    account: "Compte",
    qmapsAccount: "Compte QMaps",
    accountPitch: "Un seul compte pour découvrir et faire affaire au Québec",
    roleAdmin: "Administrateur",
    roleMerchant: "Mode professionnel",
    roleClient: "Mode client",
    publicProfile: "Profil public",
    myProjects: "Mes projets",
    collections: "Collections",
    merchantPortal: "Portail marchand",
    merchantPortalSub: "Tableau de bord marchand",
    becomePro: "Devenir professionnel",
    becomeProSub: "Inscrire votre entreprise",
    admin: "Administration",
    signOut: "Se déconnecter",
    continueGoogle: "Continuer avec Google",
    connecting: "Connexion…",
    continueEmail: "Continuer par courriel",
    smsVerify: "Vérification par SMS",
    smsVerifySub: "Disponible après la connexion",
    proSpace: "Espace professionnel",
    proSpaceSub: "Pour les entreprises et les pros",
    createAccount: "Créer un compte",
    ecosystem: "Un service préparé pour l'écosystème GROUPE TAKATAK",
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
    account: "Account",
    qmapsAccount: "QMaps account",
    accountPitch: "One account to discover and do business in Québec",
    roleAdmin: "Administrator",
    roleMerchant: "Professional mode",
    roleClient: "Client mode",
    publicProfile: "Public profile",
    myProjects: "My projects",
    collections: "Collections",
    merchantPortal: "Merchant portal",
    merchantPortalSub: "Merchant dashboard",
    becomePro: "Become a professional",
    becomeProSub: "List your business",
    admin: "Administration",
    signOut: "Sign out",
    continueGoogle: "Continue with Google",
    connecting: "Signing in…",
    continueEmail: "Continue with email",
    smsVerify: "SMS verification",
    smsVerifySub: "Available after sign-in",
    proSpace: "Business space",
    proSpaceSub: "For businesses and pros",
    createAccount: "Create an account",
    ecosystem: "A service prepared for the GROUPE TAKATAK ecosystem",
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
    account: "Cuenta",
    qmapsAccount: "Cuenta QMaps",
    accountPitch: "Una sola cuenta para descubrir y hacer negocios en Quebec",
    roleAdmin: "Administrador",
    roleMerchant: "Modo profesional",
    roleClient: "Modo cliente",
    publicProfile: "Perfil público",
    myProjects: "Mis proyectos",
    collections: "Colecciones",
    merchantPortal: "Portal comercial",
    merchantPortalSub: "Panel del comercio",
    becomePro: "Hazte profesional",
    becomeProSub: "Registra tu empresa",
    admin: "Administración",
    signOut: "Cerrar sesión",
    continueGoogle: "Continuar con Google",
    connecting: "Conectando…",
    continueEmail: "Continuar con correo",
    smsVerify: "Verificación por SMS",
    smsVerifySub: "Disponible tras iniciar sesión",
    proSpace: "Espacio profesional",
    proSpaceSub: "Para empresas y profesionales",
    createAccount: "Crear una cuenta",
    ecosystem: "Un servicio preparado para el ecosistema GROUPE TAKATAK",
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
