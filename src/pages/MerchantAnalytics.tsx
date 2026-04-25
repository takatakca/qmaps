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

type ChecklistItem = {
  key: string;
  label: string;
  description: string;
  done: boolean;
  to: string;
  cta: string;
};

const MerchantAnalytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("");
  const [business, setBusiness] = useState<{ description: string | null; phone: string | null; website: string | null; hours: string | null; photos: string[] | null; image_url: string | null; reviews_count: number } | null>(null);
  const [days, setDays] = useState<7 | 30>(7);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id,name,description,phone,website,hours,photos,image_url,reviews_count")
        .eq("owner_user_id", user.id)
        .limit(1)
        .maybeSingle();
      setBusinessId(data?.id ?? null);
      setBusinessName(data?.name ?? "");
      setBusiness(data ?? null);
    })();
  }, [user]);

  const { events, totals, loading } = useMerchantAnalytics(businessId, days);

  const totalEvents = useMemo(
    () => Object.values(totals as unknown as Record<string, number>).reduce((a, b) => a + (b || 0), 0),
    [totals]
  );

  const checklist = useMemo<ChecklistItem[]>(() => {
    const photoCount = (business?.photos?.length ?? 0) + (business?.image_url ? 1 : 0);
    return [
      {
        key: "info",
        label: "Compléter les infos de base",
        description: "Téléphone, site web et heures d'ouverture aident les clients à vous contacter.",
        done: !!(business?.phone && business?.website && business?.hours),
        to: "/merchant/business-info",
        cta: "Modifier",
      },
      {
        key: "description",
        label: "Ajouter une description",
        description: "Décrivez ce qui rend votre commerce unique en quelques phrases.",
        done: !!(business?.description && business.description.length > 40),
        to: "/merchant/business-info",
        cta: "Rédiger",
      },
      {
        key: "photos",
        label: "Ajouter au moins 3 photos",
        description: "Les fiches avec photos génèrent jusqu'à 2× plus de vues.",
        done: photoCount >= 3,
        to: "/merchant/photos",
        cta: "Ajouter",
      },
      {
        key: "services",
        label: "Configurer vos services",
        description: "Sélectionnez vos catégories pour recevoir des demandes de projet pertinentes.",
        done: false,
        to: "/merchant/services",
        cta: "Configurer",
      },
      {
        key: "reviews",
        label: "Obtenir vos premiers avis",
        description: "Partagez votre fiche avec vos clients pour récolter des avis authentiques.",
        done: (business?.reviews_count ?? 0) > 0,
        to: "/merchant/business-info",
        cta: "Partager",
      },
    ];
  }, [business]);

  const ChecklistCard = ({ title, subtitle }: { title: string; subtitle: string }) => {
    const remaining = checklist.filter((c) => !c.done).length;
    return (
      <Card className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          {remaining > 0 && (
            <span className="text-xs font-medium text-muted-foreground shrink-0">
              {checklist.length - remaining}/{checklist.length}
            </span>
          )}
        </div>
        <ul className="space-y-1">
          {checklist.map((item) => (
            <li key={item.key}>
              <button
                onClick={() => navigate(item.to)}
                className="w-full flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/60 transition-colors text-left"
              >
                {item.done ? (
                  <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
                ) : (
                  <Circle size={18} className="text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.done ? "line-through text-muted-foreground" : ""}`}>
                    {item.label}
                  </p>
                  {!item.done && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  )}
                </div>
                {!item.done && (
                  <span className="flex items-center gap-0.5 text-xs font-medium text-primary shrink-0 mt-0.5">
                    {item.cta}
                    <ChevronRight size={14} />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </Card>
    );
  };


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
          <>
            <Card className="p-6 text-center space-y-3">
              <p className="text-muted-foreground">Aucune entreprise associée à votre compte.</p>
              <Button onClick={() => navigate("/merchant/onboarding")}>Réclamer ma fiche</Button>
            </Card>
          </>
        ) : loading ? (
          <p className="text-muted-foreground text-sm">Chargement...</p>
        ) : (
          <>
            {/* Zero-activity hero checklist */}
            {totalEvents === 0 && (
              <ChecklistCard
                title="Faites décoller vos statistiques"
                subtitle="Complétez ces étapes pour générer vos premières vues et interactions."
              />
            )}

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
                totalEvents === 0 ? (
                  <Card className="p-6 text-center space-y-1">
                    <p className="text-sm font-medium">Pas encore d'activité</p>
                    <p className="text-xs text-muted-foreground">
                      Complétez la checklist ci-dessus pour attirer vos premiers visiteurs.
                    </p>
                  </Card>
                ) : (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground text-sm">Aucune activité sur cette période.</p>
                  </Card>
                )
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

            {/* Persistent checklist when there's some activity but room to improve */}
            {totalEvents > 0 && checklist.some((c) => !c.done) && (
              <ChecklistCard
                title="Optimisez votre fiche"
                subtitle="Quelques actions rapides pour augmenter encore vos statistiques."
              />
            )}
          </>
        )}
      </div>

      <MerchantBottomNav />
    </div>
  );
};

export default MerchantAnalytics;
