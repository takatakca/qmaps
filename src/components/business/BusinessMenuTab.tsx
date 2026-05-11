import { useEffect, useState } from "react";
import { Utensils } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  filterAvailableMenuItems,
  formatPriceCents,
  groupMenuItemsByCategory,
  type MenuItem,
} from "@/lib/menuItems";

interface Props {
  businessId: string;
}

const BusinessMenuTab = ({ businessId }: Props) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await (supabase as any)
        .from("business_menu_items")
        .select("*")
        .eq("business_id", businessId)
        .eq("is_available", true);
      if (!cancelled) {
        setItems((data as MenuItem[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [businessId]);

  if (loading) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Chargement du menu…</div>;
  }

  const visible = filterAvailableMenuItems(items);
  if (visible.length === 0) {
    return (
      <div className="py-10 text-center">
        <Utensils size={32} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-foreground">Aucun menu publié</p>
        <p className="text-xs text-muted-foreground mt-1">Le commerçant n'a pas encore ajouté d'articles.</p>
      </div>
    );
  }

  const grouped = groupMenuItemsByCategory(visible);

  return (
    <div className="space-y-5">
      <h3 className="font-heading text-lg font-bold text-foreground">Menu</h3>
      {grouped.map((cat) => (
        <div key={cat.category}>
          <h4 className="font-heading font-semibold text-foreground mb-3">{cat.category}</h4>
          <div className="space-y-3">
            {cat.items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-card rounded-xl border border-border">
                {item.photo_url && (
                  <img src={item.photo_url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                  )}
                </div>
                {item.price_cents != null && (
                  <span className="text-sm font-semibold text-foreground ml-3 shrink-0">
                    {formatPriceCents(item.price_cents, item.currency)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BusinessMenuTab;
