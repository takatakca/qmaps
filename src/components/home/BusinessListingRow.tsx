import { Link } from "react-router-dom";
import BusinessListingCard from "./BusinessListingCard";
import HorizontalShortcutRow, { type Shortcut } from "./HorizontalShortcutRow";
import type { HomeListing } from "@/hooks/useHomeListings";

interface Props {
  title: string;
  subtitle?: string;
  businesses: HomeListing[];
  loading?: boolean;
  seeAllHref?: string;
  /** Shown instead of listings when no real business matches this section. */
  fallbackShortcuts: Shortcut[];
  fallbackTitle?: string;
  emptyMessage?: string;
}

const BusinessListingRow = ({
  title,
  subtitle,
  businesses,
  loading,
  seeAllHref,
  fallbackShortcuts,
  fallbackTitle,
  emptyMessage = "Aucune entreprise active pour l'instant dans cette section.",
}: Props) => {
  if (loading) {
    return (
      <section className="space-y-3">
        <div className="h-5 w-48 animate-pulse rounded bg-muted" />
        <div className="-mx-4 flex gap-3 overflow-hidden px-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[220px] w-[212px] shrink-0 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </section>
    );
  }

  if (businesses.length === 0) {
    return (
      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-base font-bold text-foreground">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{emptyMessage}</p>
        </div>
        <HorizontalShortcutRow
          title={fallbackTitle ?? "Explorer ces catégories"}
          items={fallbackShortcuts}
          seeAllHref={seeAllHref}
        />
        <div className="flex flex-wrap gap-2">
          <Link
            to="/merchant/onboarding"
            className="rounded-full bg-brand-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft"
          >
            Enregistrer votre entreprise
          </Link>
          <Link
            to="/services"
            className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-soft"
          >
            Voir tous les services
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-heading text-base font-bold text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {seeAllHref && (
          <Link to={seeAllHref} className="whitespace-nowrap text-xs font-semibold text-primary hover:underline">
            Voir tout
          </Link>
        )}
      </div>
      <div className="scrollbar-hide -mx-4 overflow-x-auto px-4">
        <div className="flex gap-3 pb-1">
          {businesses.map((b) => (
            <BusinessListingCard key={b.id} business={b} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BusinessListingRow;
