import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import BusinessCard from "@/components/BusinessCard";
import { mapBusinessToCard, type BusinessCardSource } from "@/lib/business";
import { formatRecommendationReasons, type RecommendationReasonCode } from "@/lib/recommendations";
import { useDirectoryAccount } from "@/hooks/useDirectoryAccount";
import { directoryPreferenceKey } from "@/hooks/useRecommendedBusinesses";
import { useToast } from "@/hooks/use-toast";
import { ownedApi } from "@/lib/ownedApi";

interface RecommendationItem {
  business: BusinessCardSource;
  reasonCodes?: RecommendationReasonCode[];
}

interface Props {
  title: string;
  subtitle?: string;
  items: RecommendationItem[];
  showReasonChips?: boolean;
  loading?: boolean;
}

export default function DirectoryRecommendations({ title, subtitle, items, showReasonChips = true, loading }: Props) {
  const account = useDirectoryAccount();
  const cache = useQueryClient();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState<Record<string, string[]>>({});
  const scope = account.data ?? "guest";
  const visible = items.filter(item => !dismissed[scope]?.includes(item.business.id));
  if (!loading && visible.length === 0) return null;

  async function dismiss(id: string) {
    setDismissed(previous => ({ ...previous, [scope]: [...(previous[scope] ?? []), id] }));
    if (!account.data) return;
    try {
      await ownedApi("me/directory-preferences/" + id, "PUT", { action: "dismiss", accountId: account.data });
      await cache.invalidateQueries({ queryKey: [...directoryPreferenceKey, account.data] });
    } catch {
      setDismissed(previous => ({ ...previous, [scope]: previous[scope].filter(item => item !== id) }));
      toast({ title: "Impossible de retirer cette recommandation. Réessayez.", variant: "destructive" });
    }
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {loading ? <p className="text-xs text-muted-foreground py-4">Chargement…</p> :
        visible.map(item => (
          <div key={item.business.id}>
            <BusinessCard ownedDirectory business={mapBusinessToCard(item.business)} />
            <div className="flex items-center justify-end gap-2 mt-1 px-1">
              {showReasonChips && !!item.reasonCodes?.length && (
                <span className="mr-auto text-[10px] font-medium text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                  {formatRecommendationReasons(item.reasonCodes)}
                </span>
              )}
              <button type="button" onClick={() => void dismiss(item.business.id)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground p-1">
                <X size={12} />
                Pas intéressé
              </button>
            </div>
          </div>
        ))}
    </section>
  );
}
