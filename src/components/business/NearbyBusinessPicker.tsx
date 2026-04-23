import { MapPin, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistance } from "@/lib/geo";
import type { BusinessWithDistance } from "@/lib/business";

interface NearbyBusinessPickerProps {
  businesses: BusinessWithDistance[];
  loading: boolean;
  error?: string | null;
  emptyLabel: string;
  onSelect: (business: BusinessWithDistance) => void;
  onRefresh?: () => void;
}

const NearbyBusinessPicker = ({ businesses, loading, error, emptyLabel, onSelect, onRefresh }: NearbyBusinessPickerProps) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex items-center gap-3 py-2">
            <Skeleton className="h-14 w-14 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-center">
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        {error && <p className="mt-2 text-xs text-muted-foreground">{error}</p>}
        {onRefresh && (
          <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={onRefresh}>
            <RefreshCcw className="mr-1" /> Réessayer
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {businesses.map((business) => (
        <button key={business.id} onClick={() => onSelect(business)} className="flex w-full items-center gap-3 py-3 text-left">
          <img src={business.image_url || "/placeholder.svg"} alt={business.name} className="h-14 w-14 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{business.name}</p>
            <p className="truncate text-xs text-muted-foreground">{business.address}</p>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin size={12} />
              <span>{formatDistance(business.distance_meters) || business.city}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default NearbyBusinessPicker;