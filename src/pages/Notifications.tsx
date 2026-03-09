import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Star, Utensils, Wrench, Sparkles } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const mockNotifications = [
  { id: "1", icon: Utensils, title: "Prêt pour une sortie?", desc: "Découvrez les restaurants près de vous", time: "1 jour", image: null },
  { id: "2", icon: Wrench, title: "Toujours à la recherche d'un plombier?", desc: "Partagez quelques détails et connectez-vous avec des pros locaux — c'est rapide et gratuit.", time: "9 jours", image: null },
  { id: "3", icon: Utensils, title: "Envie de livraison?", desc: "Pour le dîner, essayez La Banquise, un favori local.", time: "4 mois", image: null },
  { id: "4", icon: Star, title: "Commerces les mieux notés", desc: "Découvrez les meilleurs commerces de Montréal cette semaine.", time: "4 mois", image: null },
  { id: "5", icon: Sparkles, title: "Un problème à la maison?", desc: "Peu importe la situation, l'assistant QMAPS peut vous aider.", time: "5 mois", image: null },
];

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(mockNotifications);

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground">Notifications</h1>
      </div>

      <div className="divide-y divide-border">
        {notifications.length === 0 && (
          <div className="text-center py-16">
            <Sparkles size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucune notification</p>
          </div>
        )}
        {notifications.map(n => (
          <button
            key={n.id}
            className="w-full flex items-start gap-3 p-4 hover:bg-accent/30 transition-colors text-left"
            onClick={() => dismiss(n.id)}
          >
            <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <n.icon size={24} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground"><span className="font-semibold">{n.title}</span> {n.desc}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{n.time}</span>
          </button>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Notifications;
