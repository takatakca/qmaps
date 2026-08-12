import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Compass } from "lucide-react";

interface Action {
  label: string;
  to: string;
  variant?: "primary" | "ghost";
}

interface Props {
  title: string;
  message: string;
  image?: string;
  icon?: LucideIcon;
  actions?: Action[];
}

/**
 * Premium empty state — shown when a section has no real DB-backed businesses.
 * Never renders fake listings.
 */
const PremiumEmptyState = ({ title, message, image, icon: Icon = Compass, actions = [] }: Props) => (
  <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
    {image && (
      <img
        src={image}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-25"
      />
    )}
    <div className="absolute inset-0 bg-gradient-to-br from-card via-card/90 to-primary/10" />
    <div className="relative flex flex-col gap-3 p-6">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-glow">
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <div>
        <h3 className="font-heading text-[15px] font-bold text-foreground">{title}</h3>
        <p className="mt-1 max-w-md text-[13px] leading-relaxed text-muted-foreground">{message}</p>
      </div>
      {actions.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-2">
          {actions.map((a) => (
            <Link
              key={a.to + a.label}
              to={a.to}
              className={
                a.variant === "ghost"
                  ? "inline-flex items-center gap-1 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:text-primary"
                  : "inline-flex items-center gap-1 rounded-full bg-brand-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft transition-shadow hover:shadow-glow"
              }
            >
              {a.label} <ArrowUpRight size={13} />
            </Link>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default PremiumEmptyState;
