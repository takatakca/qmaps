import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

export interface Shortcut {
  label: string;
  q?: string;
  to?: string;
  icon: LucideIcon;
  tint?: string; // tailwind bg class for icon halo
}

interface Props {
  title: string;
  subtitle?: string;
  items: Shortcut[];
  seeAllHref?: string;
}

const HorizontalShortcutRow = ({ title, subtitle, items, seeAllHref }: Props) => {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-heading text-base font-bold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {seeAllHref && (
          <Link
            to={seeAllHref}
            className="text-xs font-semibold text-primary hover:underline whitespace-nowrap"
          >
            Voir tout
          </Link>
        )}
      </div>
      <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 pb-1">
          {items.map((it) => {
            const Icon = it.icon;
            const href = it.to ?? `/search?q=${encodeURIComponent(it.q ?? it.label)}`;
            return (
              <Link
                key={it.label}
                to={href}
                className="group shrink-0 w-[120px] rounded-2xl bg-card border border-border shadow-soft hover:shadow-elevated hover:border-primary/30 transition-all p-3 flex flex-col items-start gap-2"
              >
                <span
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${it.tint ?? "bg-primary/10"} text-primary group-hover:scale-105 transition-transform`}
                >
                  <Icon size={20} strokeWidth={2} />
                </span>
                <span className="text-[13px] font-semibold text-foreground leading-tight line-clamp-2">
                  {it.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HorizontalShortcutRow;
