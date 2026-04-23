import { Heart, Lightbulb, Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactionType } from "@/hooks/useReviewReactions";

interface ReviewReactionButtonsProps {
  counts: Record<ReactionType, number>;
  mine: Record<ReactionType, boolean>;
  pending?: string | null;
  reviewId: string;
  onToggle: (reviewId: string, reactionType: ReactionType) => void | Promise<void>;
  compact?: boolean;
}

const reactions = [
  { icon: Lightbulb, label: "Utile", type: "useful" as const },
  { icon: Smile, label: "Drôle", type: "funny" as const },
  { icon: Heart, label: "Cool", type: "cool" as const },
];

const ReviewReactionButtons = ({ counts, mine, pending, reviewId, onToggle, compact = false }: ReviewReactionButtonsProps) => (
  <div className={cn("flex gap-3", compact && "gap-2 flex-wrap")}>
    {reactions.map((reaction) => {
      const isActive = mine[reaction.type];
      const isPending = pending === `${reviewId}:${reaction.type}`;
      return (
        <button
          key={reaction.type}
          onClick={() => void onToggle(reviewId, reaction.type)}
          disabled={isPending}
          className={cn(
            compact
              ? "flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-xs transition-colors"
              : "flex flex-col items-center gap-1 group",
            isActive ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent/30",
          )}
        >
          {compact ? (
            <>
              <reaction.icon size={14} /> {reaction.label} {counts[reaction.type]}
            </>
          ) : (
            <>
              <span className={cn("w-10 h-10 rounded-full border flex items-center justify-center transition-colors", isActive ? "border-primary bg-primary/10" : "border-border group-hover:bg-secondary") }>
                <reaction.icon size={16} className={cn("transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              </span>
              <span className="text-[10px]">{reaction.label} {counts[reaction.type]}</span>
            </>
          )}
        </button>
      );
    })}
  </div>
);

export default ReviewReactionButtons;
