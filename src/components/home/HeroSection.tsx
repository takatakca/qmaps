import { Link } from "react-router-dom";
import { MapPin, Search, ShieldCheck, Star } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import LanguageSwitcher from "@/components/home/LanguageSwitcher";
import QuickAuthMenu from "@/components/home/QuickAuthMenu";
import heroImg from "@/assets/quebec-panorama.jpg";

const CHIPS = [
  "Restaurants", "Nettoyage", "Électriciens", "Comptables", "Avocats",
  "Construction", "Automobile", "Beauté", "Santé",
];

const HeroSection = () => (
  <header className="qmaps-scene relative isolate overflow-hidden">
    <img src={heroImg} alt="Panorama illustré du Vieux-Port de Montréal à l’heure bleue" width={1920} height={1024} className="absolute inset-0 h-full w-full object-cover" />
    <div className="qmaps-scene-overlay absolute inset-0" />

    <div className="relative mx-auto w-full max-w-6xl px-5 pb-9 pt-6 sm:px-8 md:pb-12 md:pt-8">
      <nav className="flex items-center justify-between gap-3">
        <Link to="/" className="font-heading text-[26px] font-bold tracking-normal qmaps-scene-text md:text-[30px]">
          Q<span className="qmaps-scene-accent">Maps</span>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="mr-2 hidden items-center gap-5 text-sm font-medium qmaps-scene-muted md:flex">
            <Link to="/search" className="inline-flex items-center gap-1.5 hover:opacity-80"><Search size={14} /> Rechercher</Link>
            <Link to="/services" className="hover:opacity-80">Services</Link>
            <Link to="/merchant/onboarding" className="qmaps-scene-control rounded-md px-3 py-2">
              Enregistrer mon entreprise
            </Link>
          </div>
          <Link to="/search" aria-label="Rechercher" className="inline-flex h-9 w-9 items-center justify-center qmaps-scene-control rounded-md md:hidden">
            <Search size={14} />
          </Link>
          <LanguageSwitcher tone="dark" />
          <QuickAuthMenu tone="dark" />
        </div>
      </nav>

      <div className="mt-6 animate-fade-up md:mt-12">
        <Link to="/city/montreal" className="qmaps-scene-muted inline-flex items-center gap-2 text-xs font-medium">
          <MapPin size={14} /> Montréal · Québec · partout au Québec
        </Link>
        <h1 className="qmaps-wordmark qmaps-scene-text mt-4 font-heading font-bold">QMaps<span className="qmaps-scene-accent">.</span></h1>
        <p className="qmaps-scene-text mt-4 max-w-xl font-heading text-[24px] font-medium leading-tight md:text-[32px]">
          Les bonnes adresses.<br />Les bonnes personnes. Au Québec.
        </p>
        <p className="qmaps-scene-muted mt-3 max-w-lg text-sm leading-relaxed">
          Restaurants, commerces et professionnels locaux.
        </p>
      </div>

      <div className="relative mt-5 max-w-2xl md:mt-8 animate-fade-up [animation-delay:120ms]">
        <div className="relative rounded-lg border border-border bg-card p-2 text-card-foreground shadow-elevated">
          <SearchBar smart />
        </div>
      </div>

      <div className="mt-4 flex max-w-3xl flex-wrap gap-1.5 md:gap-2 animate-fade-up [animation-delay:200ms]">
        {CHIPS.map((chip) => (
          <Link
            key={chip}
            to={`/search?q=${encodeURIComponent(chip.toLowerCase())}`}
            className="qmaps-scene-control rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
          >
            {chip}
          </Link>
        ))}
      </div>

      <div className="qmaps-scene-muted qmaps-scene-rule mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-4 text-[10px] font-medium uppercase tracking-normal">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={13} /> Entreprises vérifiées
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Star size={13} /> Avis authentiques
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={13} /> 100 % Québec
        </span>
        <span className="inline-flex items-center gap-1.5 qmaps-scene-muted">
           Propulsé par GROUPE TAKATAK
        </span>
      </div>
    </div>
  </header>
);

export default HeroSection;
