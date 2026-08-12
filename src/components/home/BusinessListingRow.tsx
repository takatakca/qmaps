import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import BusinessListingCard from "./BusinessListingCard";
import HorizontalShortcutRow, { type Shortcut } from "./HorizontalShortcutRow";
import PremiumEmptyState from "./PremiumEmptyState";
import type { HomeListing } from "@/hooks/useHomeListings";

interface Props {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  businesses: HomeListing[];
  loading?: boolean;
  seeAllHref?: string;
  /** Shown instead of listings when no real business matches this section. */
  fallbackShortcuts: Shortcut[];
  fallbackTitle?: string;
  fallbackImage?: string;
  emptyMessage?: string;
}

const SectionHeader = ({
  title,
  subtitle,
  eyebrow,
  seeAllHref,
}: Pick<Props, "title" | "subtitle" | "eyebrow" | "seeAllHref">) => (
  <div className="flex items-end justify-between gap-4">
    <div>
      {eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      )}
      <h2 className="mt-1 font-heading text-[20px] font-bold tracking-tight text-foreground md:text-[26px]">
        {title}
      </h2>
      {subtitle && <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{subtitle}</p>}
    </div>
    {seeAllHref && (
      <Link
        to={seeAllHref}
        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:text-primary"
      >
        Voir tout <ArrowUpRight size={13} />
      </Link>
    )}
  </div>
);

const BusinessListingRow = ({
  title,
  subtitle,
  eyebrow,
  businesses,
  loading,
  seeAllHref,
  fallbackShortcuts,
  fallbackTitle,
  fallbackImage,
  emptyMessage = "Aucune entreprise active pour l'instant dans cette section.",
}: Props) => {
  if (loading) {
    return (
      <section className="space-y-4">
        <div className="h-6 w-52 animate-pulse rounded-full bg-muted" />
        <div className="-mx-5 flex gap-4 overflow-hidden px-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[300px] w-[268px] shrink-0 animate-pulse rounded-3xl bg-muted" />
          ))}
        </div>
      </section>
    );
  }

  if (businesses.length === 0) {
    return (
      <section className="space-y-4">
        <SectionHeader title={title} subtitle={subtitle} eyebrow={eyebrow} />
        <PremiumEmptyState
          title="Cette section attend ses premières entreprises"
          message={emptyMessage}
          image={fallbackImage}
          actions={[
            { label: "Enregistrer votre entreprise", to: "/merchant/onboarding" },
            { label: "Voir tous les services", to: "/services", variant: "ghost" },
          ]}
        />
        <HorizontalShortcutRow
          title={fallbackTitle ?? "Explorer ces catégories"}
          items={fallbackShortcuts}
          seeAllHref={seeAllHref}
        />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <SectionHeader title={title} subtitle={subtitle} eyebrow={eyebrow} seeAllHref={seeAllHref} />
      <div className="scrollbar-hide -mx-5 overflow-x-auto px-5 md:-mx-8 md:px-8">
        <div className="flex gap-4 pb-2">
          {businesses.map((b) => (
            <BusinessListingCard key={b.id} business={b} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BusinessListingRow;
