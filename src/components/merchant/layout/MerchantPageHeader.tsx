import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import StatusPill, { type IntegrationStatus } from "@/components/takatak/StatusPill";

interface Props {
  title: string;
  subtitle?: string;
  back?: string | -1 | false;
  status?: { status: IntegrationStatus; label?: string };
  right?: ReactNode;
  icon?: ReactNode;
}

/** Shared "Portail marchand" top bar (TAKATAK dashboard visual standard). Presentation only. */
const MerchantPageHeader = ({ title, subtitle, back = "/merchant/home", status, right, icon }: Props) => {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/90 px-4 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {back !== false && (
          <button
            onClick={() => (back === -1 ? navigate(-1) : navigate(back))}
            aria-label="Retour"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Portail marchand · QMaps</p>
          <div className="flex items-center gap-2">
            {icon}
            <h1 className="truncate font-heading text-base font-bold text-foreground">{title}</h1>
            {status && <StatusPill status={status.status} label={status.label} className="shrink-0" />}
          </div>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {right && <div className="flex shrink-0 items-center gap-1">{right}</div>}
      </div>
    </header>
  );
};

export default MerchantPageHeader;
