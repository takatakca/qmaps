import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Share2, CalendarDays, Star, MapPin } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const mockEvents = {
  official: [
    { id: "1", title: "Bienvenue sur QMAPS!", date: "1 jan, 13h00", badge: "Événement QMAPS", icon: Star },
  ],
  popular: [
    { id: "2", title: "Pop-up marché local — Journée gourmande", date: "Aujourd'hui 10h00 - 17h00", icon: MapPin },
  ],
};

const Events = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
          <h1 className="font-heading text-lg font-bold text-foreground">Événements</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2"><Bell size={20} className="text-foreground" /></button>
          <button className="p-2"><Share2 size={20} className="text-foreground" /></button>
          <button className="p-2"><CalendarDays size={20} className="text-foreground" /></button>
        </div>
      </div>

      <div className="bg-muted px-4 py-3">
        <h2 className="text-sm font-bold text-foreground">Événements officiels QMAPS</h2>
      </div>
      {mockEvents.official.map(e => (
        <button key={e.id} className="w-full flex items-start gap-3 px-4 py-3 border-b border-border text-left">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <e.icon size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{e.title}</p>
            <p className="text-xs text-muted-foreground">{e.date}</p>
            {e.badge && (
              <p className="text-xs text-primary font-medium flex items-center gap-1 mt-0.5">
                <Star size={10} className="fill-primary" /> {e.badge}
              </p>
            )}
          </div>
        </button>
      ))}

      <div className="bg-muted px-4 py-3 mt-2">
        <h2 className="text-sm font-bold text-foreground">Événements populaires</h2>
      </div>
      {mockEvents.popular.map(e => (
        <button key={e.id} className="w-full flex items-start gap-3 px-4 py-3 border-b border-border text-left">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <e.icon size={20} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{e.title}</p>
            <p className="text-xs text-muted-foreground">{e.date}</p>
          </div>
        </button>
      ))}

      <BottomNav />
    </div>
  );
};

export default Events;
