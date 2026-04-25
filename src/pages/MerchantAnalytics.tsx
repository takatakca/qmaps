import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Phone, Globe, MapPin, MessageSquare, Bookmark, Image as ImageIcon, Briefcase, Send, CheckCircle2, Circle, ChevronRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMerchantAnalytics } from "@/hooks/useMerchantAnalytics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MerchantBottomNav from "@/components/MerchantBottomNav";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const EVENT_LABELS: Record<string, { label: string; icon: any }> = {
  profile_view: { label: "Vues du profil", icon: Eye },
  phone_click: { label: "Appels", icon: Phone },
  website_click: { label: "Site web", icon: Globe },
  directions_click: { label: "Itinéraires", icon: MapPin },
  message_click: { label: "Messages", icon: MessageSquare },
  save_click: { label: "Sauvegardes", icon: Bookmark },
  photo_view: { label: "Photos vues", icon: ImageIcon },
  project_start: { label: "Projets démarrés", icon: Briefcase },
  quote_sent: { label: "Devis envoyés", icon: Send },
};

const MerchantAnalytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("");
  const [days, setDays] = useState<7 | 30>(7);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id,name")
        .eq("owner_user_id", user.id)
        .limit(1)
        .maybeSingle();
      setBusinessId(data?.id ?? null);
      setBusinessName(data?.name ?? "");
    })();
  }, [user]);

  const { events, totals, loading } = useMerchantAnalytics(businessId, days);

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <header className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-lg font-bold truncate">Statistiques</h1>
          {businessName && <p className="text-xs text-muted-foreground truncate">{businessName}</p>}
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Range toggle */}
        <div className="flex gap-2">
          <Button size="sm" variant={days === 7 ? "default" : "outline"} onClick={() => setDays(7)}>7 jours</Button>
          <Button size="sm" variant={days === 30 ? "default" : "outline"} onClick={() => setDays(30)}>30 jours</Button>
        </div>

        {!businessId && !loading ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Aucune entreprise associée à votre compte.</p>
          </Card>
        ) : loading ? (
          <p className="text-muted-foreground text-sm">Chargement...</p>
        ) : (
          <>
            {/* Stat grid */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(EVENT_LABELS).map(([key, def]) => {
                const Icon = def.icon;
                const value = (totals as any)[key] as number;
                return (
                  <Card key={key} className="p-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon size={14} />
                      <span className="text-xs">{def.label}</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                  </Card>
                );
              })}
            </div>

            {/* Recent activity */}
            <div>
              <h2 className="font-heading font-bold mb-2">Activité récente</h2>
              {events.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground text-sm">Aucune activité sur cette période.</p>
                </Card>
              ) : (
                <Card className="divide-y divide-border">
                  {events.slice(0, 30).map((e) => {
                    const def = EVENT_LABELS[e.event_type];
                    const Icon = def?.icon ?? Eye;
                    return (
                      <div key={e.id} className="p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Icon size={14} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{def?.label ?? e.event_type}</p>
                          {e.source && <p className="text-xs text-muted-foreground">{e.source}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(e.created_at), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                    );
                  })}
                </Card>
              )}
            </div>
          </>
        )}
      </div>

      <MerchantBottomNav />
    </div>
  );
};

export default MerchantAnalytics;
