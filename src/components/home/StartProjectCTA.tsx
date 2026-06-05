import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import StartProjectSheet from "@/components/projects/StartProjectSheet";

const StartProjectCTA = () => {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-2xl p-5 bg-brand-gradient text-primary-foreground shadow-elevated relative overflow-hidden group"
      >
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="flex items-start gap-3 relative">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-foreground/15 backdrop-blur">
            <Sparkles size={20} />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-base font-bold">Commencer un projet</h3>
            <p className="text-[13px] mt-1 opacity-90 leading-relaxed">
              Décrivez ce dont vous avez besoin — les bons pros du Québec viendront à vous avec leurs devis.
            </p>
            <span className="inline-flex items-center gap-1 mt-3 text-sm font-semibold">
              Publier mon projet <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </button>
      <StartProjectSheet open={open} onOpenChange={setOpen} />
    </section>
  );
};

export default StartProjectCTA;
