import { Link } from "react-router-dom";
import { MapPin, Search, ShieldCheck, Star } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import LanguageSwitcher from "@/components/home/LanguageSwitcher";
import QuickAuthMenu from "@/components/home/QuickAuthMenu";
import heroImg from "@/assets/hero-quebec.jpg";

const CHIPS = [
  "Restaurants", "Nettoyage", "Électriciens", "Comptables", "Avocats",
  "Construction", "Automobile", "Beauté", "Santé",
];

const HeroSection = () => (
  <header className="relative isolate overflow-hidden bg-[hsl(222_60%_5%)] text-white">
    <img
      src={heroImg}
      alt="Vue nocturne d'une ville du Québec"
      width={1536}
      height={1024}
      className="absolute inset-0 h-full w-full object-cover opacity-70"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-[rgba(5,10,20,0.72)] via-[rgba(4,28,70,0.72)] to-[rgba(5,10,20,0.97)]" />
    <div
      aria-hidden
      className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[hsl(211_100%_50%)]/40 blur-[90px] animate-pulse-glow"
    />
    <div
      aria-hidden
      className="pointer-events-none absolute -bottom-28 -right-10 h-64 w-64 rounded-full bg-[hsl(216_100%_40%)]/40 blur-[100px]"
    />

    <div className="relative mx-auto w-full max-w-6xl px-5 pb-12 pt-6 sm:px-8 md:pb-20 md:pt-8">
      <nav className="flex items-center justify-between gap-3">
        <Link to="/" className="font-heading text-[26px] font-bold tracking-tight text-white md:text-[30px]">
          Q<span className="bg-gradient-to-r from-[#7CC0FF] to-white bg-clip-text text-transparent">Maps</span>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="mr-2 hidden items-center gap-5 text-sm font-medium text-white/80 md:flex">
            <Link to="/search" className="inline-flex items-center gap-1.5 hover:text-white"><Search size={14} /> Rechercher</Link>
            <Link to="/services" className="hover:text-white">Services</Link>
            <Link to="/merchant/onboarding" className="rounded-full border border-white/25 px-3 py-1.5 hover:bg-white/10 hover:text-white">
              Enregistrer mon entreprise
            </Link>
          </div>
          <Link to="/search" aria-label="Rechercher" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md md:hidden">
            <Search size={14} />
          </Link>
          <LanguageSwitcher tone="dark" />
          <QuickAuthMenu tone="dark" />
        </div>
      </nav>

      <div className="mt-10 max-w-3xl animate-fade-up md:mt-16">
        <Link
          to="/city/montreal"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur-md transition-colors hover:bg-white/20"
        >
          <MapPin size={12} /> Montréal · Québec · partout au Québec
        </Link>
        <h1 className="mt-5 font-heading text-[32px] font-bold leading-[1.08] tracking-tight text-white sm:text-[44px] md:text-[58px]">
          Découvrez les meilleurs commerces et professionnels du{" "}
          <span className="bg-gradient-to-r from-[#7CC0FF] via-white to-[#DCEBFF] bg-clip-text text-transparent">
            Québec
          </span>
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/75 md:text-[17px]">
          Restaurants, services locaux, experts, entreprises vérifiées et demandes de projets —
          tout au même endroit.
        </p>
      </div>

      <div className="relative mt-8 max-w-2xl animate-fade-up [animation-delay:120ms]">
        <div
          aria-hidden
          className="absolute -inset-3 rounded-[28px] bg-[hsl(211_100%_50%)]/25 blur-2xl"
        />
        <div className="relative rounded-[22px] border border-white/15 bg-white/95 p-2 shadow-[0_24px_60px_-18px_rgba(0,10,40,0.75)] backdrop-blur-xl dark:bg-card/95">
          <SearchBar smart />
        </div>
      </div>

      <div className="mt-5 flex max-w-3xl flex-wrap gap-2 animate-fade-up [animation-delay:200ms]">
        {CHIPS.map((chip) => (
          <Link
            key={chip}
            to={`/search?q=${encodeURIComponent(chip.toLowerCase())}`}
            className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20"
          >
            {chip}
          </Link>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/55">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={13} /> Entreprises vérifiées
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Star size={13} /> Avis authentiques
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={13} /> 100 % Québec
        </span>
        <span className="inline-flex items-center gap-1.5 text-white/40">
          <span className="h-px w-4 bg-white/30" /> Propulsé par GROUPE TAKATAK
        </span>
      </div>
    </div>
  </header>
);

export default HeroSection;
