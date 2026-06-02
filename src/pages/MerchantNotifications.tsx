import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MerchantBottomNav from "@/components/MerchantBottomNav";
import {
  ArrowLeft, Bell, Star, MessageSquare, Megaphone, CreditCard,
  ShieldCheck, Sparkles, CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

// MVP STAGED DATA — NOT WIRED TO BACKEND
// The `notifications` table exists but is not yet populated by server events.
// These items are sample placeholders so merchants can preview the UX shape.
// Replace with `useNotifications()` once notification producers are live.
const mockNotifications = [
  { id: "1", icon: Star, title: "Nouvel avis reçu", desc: "Un client a laissé un avis 5 étoiles sur votre entreprise.", time: "Il y a 2h", read: false, route: "/merchant" },
  { id: "2", icon: MessageSquare, title: "Nouveau message", desc: "Vous avez reçu une demande d'un client potentiel.", time: "Il y a 5h", read: false, route: "/merchant/messages" },
  { id: "3", icon: Megaphone, title: "Campagne terminée", desc: "Votre campagne Boost Local est terminée. Consultez les résultats.", time: "Hier", read: true, route: "/merchant/optimization" },
  { id: "4", icon: CreditCard, title: "Paiement confirmé", desc: "Votre paiement de CA$12.00 a été traité avec succès.", time: "Il y a 3 jours", read: true, route: "/merchant/billing" },
  { id: "5", icon: ShieldCheck, title: "Profil vérifié", desc: "Votre entreprise a été vérifiée avec succès.", time: "Il y a 1 sem.", read: true, route: "/merchant/marketplace" },
];

const MerchantNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/merchant/home")}><ArrowLeft size={22} className="text-foreground" /></button>
          <h1 className="font-heading text-lg font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-primary font-medium">
            <CheckCheck size={14} /> Tout lire
          </button>
        )}
      </div>

      {/* MVP staging notice */}
      <div className="px-4 pt-3">
        <MvpPreviewBadge
          description="Les notifications temps réel (nouveaux avis, messages, paiements) seront branchées dans une prochaine mise à jour. Les compteurs de badges, eux, sont déjà en direct."
        />
      </div>

      {/* Notifications list */}
      <div className="divide-y divide-border">
        {notifications.length === 0 && (
          <div className="text-center py-20">
            <Bell size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucune notification</p>
          </div>
        )}
        {notifications.map(n => (
          <button
            key={n.id}
            className={`w-full flex items-start gap-3 p-4 hover:bg-accent/30 transition-colors text-left ${!n.read ? "bg-primary/5" : ""}`}
            onClick={() => { markAsRead(n.id); navigate(n.route); }}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!n.read ? "bg-primary/10" : "bg-muted"}`}>
              <n.icon size={20} className={!n.read ? "text-primary" : "text-muted-foreground"} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!n.read ? "font-semibold text-foreground" : "text-foreground"}`}>{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{n.time}</span>
              {!n.read && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
          </button>
        ))}
      </div>

      <MerchantBottomNav />
    </div>
  );
};

export default MerchantNotifications;
