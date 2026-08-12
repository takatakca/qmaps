import { useState } from "react";
import { ArrowRight, PenLine, ShieldCheck, Clock } from "lucide-react";
import StartProjectSheet from "@/components/projects/StartProjectSheet";
import constructionImg from "@/assets/cat-construction.jpg";

const StartProjectCTA = () => {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button
        onClick={() => setOpen(true)}
        className="group relative isolate w-full overflow-hidden rounded-3xl border border-border/60 text-left shadow-premium transition-all duration-300 hover:-translate-y-1 hover:shadow-premium-hover"
      >
        <img
          src={constructionImg}
          alt=""
          aria-hidden
          loading="lazy"
          width={768}
          height={512}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(4,20,52,0.94)] via-[rgba(6,40,95,0.86)] to-[rgba(5,10,20,0.75)]" />
        <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-9">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/85 backdrop-blur-md">
              <PenLine size={12} /> Demande de projet
            </span>
            <h2 className="mt-3 font-heading text-[22px] font-bold leading-tight text-white md:text-[30px]">
              Décrivez votre projet, les bons pros viennent à vous
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-white/75">
              Rénovation, nettoyage, comptabilité, web — recevez des devis d'entreprises du Québec en quelques heures.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-white/60">
              <span className="inline-flex items-center gap-1.5"><Clock size={12} /> 5 étapes, 2 minutes</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={12} /> Sans engagement</span>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-6 py-3 text-sm font-bold text-[hsl(216_100%_25%)] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)] transition-transform group-hover:translate-x-0.5">
            Publier mon projet <ArrowRight size={15} />
          </span>
        </div>
      </button>
      <StartProjectSheet open={open} onOpenChange={setOpen} />
    </section>
  );
};

export default StartProjectCTA;
