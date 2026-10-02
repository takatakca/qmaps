import { cn } from "@/lib/utils";

export type IntegrationStatus = "connected" | "active" | "not_configured" | "coming_soon" | "needs_setup";

const LABELS: Record<IntegrationStatus, string> = {
  connected: "Connecté",
  active: "Actif",
  not_configured: "Non configuré",
  coming_soon: "Bientôt",
  needs_setup: "À configurer",
};

const STYLES: Record<IntegrationStatus, string> = {
  connected: "bg-primary/10 text-primary border-primary/20",
  active: "bg-primary/10 text-primary border-primary/20",
  not_configured: "bg-muted text-muted-foreground border-border",
  coming_soon: "bg-secondary text-secondary-foreground border-border",
  needs_setup: "bg-destructive/10 text-destructive border-destructive/20",
};

/** Honest integration / feature status pill (TAKATAK dashboard standard). */
const StatusPill = ({ status, label, className }: { status: IntegrationStatus; label?: string; className?: string }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
      STYLES[status],
      className,
    )}
  >
    <span className={cn("h-1.5 w-1.5 rounded-full bg-current", status === "active" || status === "connected" ? "" : "opacity-50")} />
    {label ?? LABELS[status]}
  </span>
);

export default StatusPill;
