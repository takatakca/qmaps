import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MvpPreviewBadgeProps {
  label?: string;
  description?: string;
  className?: string;
  variant?: "banner" | "inline";
}

/**
 * Honest "Aperçu MVP" badge — used on screens/sections that show staged
 * or placeholder content while the live data pipeline is being built.
 * Avoids the appearance of fake real-time data.
 */
const MvpPreviewBadge = ({
  label = "Aperçu MVP",
  description,
  className,
  variant = "banner",
}: MvpPreviewBadgeProps) => {
  if (variant === "inline") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5",
          className,
        )}
      >
        <Sparkles size={10} /> {label}
      </span>
    );
  }
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2",
        className,
      )}
    >
      <Sparkles size={14} className="text-primary mt-0.5 shrink-0" />
      <div className="text-[11px] leading-snug">
        <p className="font-semibold text-foreground">{label}</p>
        {description && <p className="text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
};

export default MvpPreviewBadge;
