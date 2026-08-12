import { Link } from "react-router-dom";
import { ArrowUpRight, Store, TrendingUp } from "lucide-react";
import merchantImg from "@/assets/cat-pro.jpg";

const MerchantBanner = () => (
  <section className="relative isolate overflow-hidden rounded-3xl border border-border/60 shadow-premium">
    <img
      src={merchantImg}
      alt=""
      aria-hidden
      loading="lazy"
      width={768}
      height={512}
      className="absolute inset-0 h-full w-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-r from-[hsl(222_60%_5%)] via-[hsl(216_100%_18%)]/90 to-[hsl(211_100%_35%)]/60" />
    <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-9">
      <div className="max-w-xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/85 backdrop-blur-md">
          <Store size={12} /> Espace entreprise
        </span>
        <h2 className="mt-3 font-heading text-[22px] font-bold leading-tight text-white md:text-[30px]">
          Faites découvrir votre entreprise à tout le Québec
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-white/70">
          Créez votre fiche QMaps, recevez des demandes de projets et gérez vos avis — gratuitement.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-white/60">
          <span className="inline-flex items-center gap-1.5"><TrendingUp size={12} /> Visibilité locale</span>
          <span>Fiche vérifiée</span>
          <span>Demandes qualifiées</span>
        </div>
      </div>
      <Link
        to="/merchant/onboarding"
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-6 py-3 text-sm font-bold text-[hsl(216_100%_25%)] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)] transition-transform hover:-translate-y-0.5"
      >
        Enregistrer mon entreprise <ArrowUpRight size={15} />
      </Link>
    </div>
  </section>
);

export default MerchantBanner;
