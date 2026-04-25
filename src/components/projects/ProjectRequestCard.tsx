import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import type { ProjectRequest } from "@/hooks/useProjectRequests";

const statusMap: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  open: { label: "Ouvert", icon: Clock, className: "bg-primary/10 text-primary" },
  in_progress: { label: "En cours", icon: Clock, className: "bg-amber-500/10 text-amber-600" },
  completed: { label: "Terminé", icon: CheckCircle2, className: "bg-green-500/10 text-green-600" },
  cancelled: { label: "Annulé", icon: XCircle, className: "bg-muted text-muted-foreground" },
};

interface Props {
  request: ProjectRequest;
  to?: string;
}

const ProjectRequestCard = ({ request, to }: Props) => {
  const status = statusMap[request.status] ?? statusMap.open;
  const Icon = status.icon;

  const content = (
    <Card className="p-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{request.title}</p>
          {request.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {request.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-muted-foreground">
            {request.city && <span>{request.city}</span>}
            {(request.budget_min || request.budget_max) && (
              <span>
                {request.budget_min ? `${request.budget_min}$` : ""}
                {request.budget_min && request.budget_max ? " – " : ""}
                {request.budget_max ? `${request.budget_max}$` : ""}
              </span>
            )}
            <span className="capitalize">{request.urgency}</span>
          </div>
        </div>
        <Badge variant="secondary" className={`${status.className} text-[10px] gap-1 shrink-0`}>
          <Icon size={10} /> {status.label}
        </Badge>
      </div>
    </Card>
  );

  return to ? <Link to={to}>{content}</Link> : content;
};

export default ProjectRequestCard;
