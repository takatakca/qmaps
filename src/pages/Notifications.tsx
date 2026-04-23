import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Star, Utensils, Wrench, Sparkles } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useNotifications } from "@/hooks/useNotifications";
import { formatRelativeTime } from "@/lib/social";

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, loading, markAsRead } = useNotifications();

  const iconForType = useMemo(() => ({
    nearby: MapPin,
    review: Star,
    dining: Utensils,
    project: Wrench,
    system: Sparkles,
    message: Sparkles,
  }), []);

  const dismiss = (id: string, link?: string | null) => {
    void markAsRead(id);
    if (link) navigate(link);
  };

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground">Notifications</h1>
      </div>

      <div className="divide-y divide-border">
        {!loading && notifications.length === 0 && (
          <div className="text-center py-16">
            <Sparkles size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucune notification</p>
          </div>
        )}
        {loading && <p className="py-10 text-center text-sm text-muted-foreground">Chargement...</p>}
        {notifications.map(n => (
          <button
            key={n.id}
            className="w-full flex items-start gap-3 p-4 hover:bg-accent/30 transition-colors text-left"
            onClick={() => dismiss(n.id, n.link)}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${n.is_read ? "bg-muted" : "bg-primary/10"}`}>
              {n.image_url ? <img src={n.image_url} alt="" className="w-full h-full rounded-xl object-cover" /> : (() => {
                const Icon = iconForType[n.type as keyof typeof iconForType] || Sparkles;
                return <Icon size={24} className={n.is_read ? "text-muted-foreground" : "text-primary"} />;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground"><span className="font-semibold">{n.title}</span> {n.body}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{formatRelativeTime(n.created_at)}</span>
          </button>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Notifications;
