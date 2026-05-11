import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

const EmptyState = ({ title, description, icon, action, className }: EmptyStateProps) => (
  <div
    role="status"
    className={cn(
      "rounded-lg border border-dashed border-border bg-card/50 p-8 text-center",
      className,
    )}
  >
    {icon && <div className="mx-auto mb-3 text-muted-foreground">{icon}</div>}
    <p className="text-sm font-semibold text-foreground">{title}</p>
    {description && (
      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>
    )}
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </div>
);

export default EmptyState;
