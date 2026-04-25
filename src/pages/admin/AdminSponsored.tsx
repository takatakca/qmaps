import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  SPONSORED_PLACEMENT_LABELS,
  SPONSORED_STATUS_LABELS,
  type SponsoredPlacement,
  type SponsoredStatus,
} from "@/lib/sponsored";
import { useAuth } from "@/hooks/useAuth";

interface Row {
  id: string;
  business_id: string;
  user_id: string;
  status: SponsoredStatus;
  placement: SponsoredPlacement;
  headline: string | null;
  description: string | null;
  target_city: string | null;
  target_category_id: string | null;
  daily_budget_cents: number | null;
  starts_at: string | null;
  ends_at: string | null;
  admin_note: string | null;
  created_at: string;
  business: { id: string; name: string; city: string } | null;
}

const AdminSponsored = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SponsoredStatus | "all">("pending_review");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const fetchRows = async () => {
    setLoading(true);
    let query = supabase
      .from("sponsored_campaigns" as any)
      .select(`*, business:businesses(id, name, city)`)
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    void fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const updateStatus = async (id: string, status: SponsoredStatus) => {
    const patch: any = {
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id ?? null,
    };
    if (notes[id]) patch.admin_note = notes[id];
    const { error } = await supabase
      .from("sponsored_campaigns" as any)
      .update(patch)
      .eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Campagne ${SPONSORED_STATUS_LABELS[status].toLowerCase()}` });
    await fetchRows();
  };

  const FILTERS: (SponsoredStatus | "all")[] = [
    "pending_review",
    "approved",
    "rejected",
    "paused",
    "draft",
    "all",
  ];

  return (
    <AdminLayout title="Sponsorisé">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Toutes" : SPONSORED_STATUS_LABELS[f]}
            </Button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune campagne.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-base">
                      {r.headline || "Sans titre"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {r.business?.name ?? r.business_id}
                      {r.business?.city ? ` · ${r.business.city}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Owner: {r.user_id.slice(0, 8)}... · Placement:{" "}
                      {SPONSORED_PLACEMENT_LABELS[r.placement]}
                      {r.target_city ? ` · Ville: ${r.target_city}` : ""}
                      {r.daily_budget_cents
                        ? ` · Budget: ${(r.daily_budget_cents / 100).toFixed(2)} $/jour`
                        : ""}
                    </p>
                    {r.description && (
                      <p className="text-sm mt-2">{r.description}</p>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {SPONSORED_STATUS_LABELS[r.status]}
                  </Badge>
                </div>

                <Textarea
                  className="mt-3"
                  placeholder="Note admin (optionnel)"
                  value={notes[r.id] ?? r.admin_note ?? ""}
                  onChange={(e) =>
                    setNotes({ ...notes, [r.id]: e.target.value })
                  }
                  rows={2}
                />

                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => updateStatus(r.id, "approved")}
                    disabled={r.status === "approved"}
                  >
                    Approuver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(r.id, "rejected")}
                    disabled={r.status === "rejected"}
                  >
                    Rejeter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(r.id, "paused")}
                    disabled={r.status === "paused"}
                  >
                    Mettre en pause
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(r.id, "ended")}
                    disabled={r.status === "ended"}
                  >
                    Terminer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSponsored;
