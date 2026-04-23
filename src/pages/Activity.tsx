import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronRight, MapPin, ImageIcon, Star, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import SuggestedUsersList from "@/components/social/SuggestedUsersList";
import { formatRelativeTime } from "@/lib/social";

type Tab = "all" | "friends" | "nearby";

const Activity = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const { all, friends, nearby, loading } = useActivityFeed();

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "TOUT" },
    { key: "friends", label: "AMIS" },
    { key: "nearby", label: "À PROXIMITÉ" },
  ];

  const items = activeTab === "all" ? all : activeTab === "friends" ? friends : nearby;

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card">
        <h1 className="font-heading text-xl font-bold text-foreground px-4 pt-4 pb-2">Activité</h1>
        <div className="flex border-b border-border">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-sm font-bold transition-colors ${activeTab === tab.key ? "text-foreground border-b-2 border-foreground" : "text-muted-foreground"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => navigate("/notifications")} className="w-full flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Bell size={18} className="text-muted-foreground" />
          <span className="text-sm text-foreground">Toutes les notifications</span>
        </div>
        <ChevronRight size={16} className="text-muted-foreground" />
      </button>

      {activeTab === "friends" && items.length === 0 && (
        <div className="px-4 py-5 border-b border-border">
          <p className="text-sm text-muted-foreground mb-4">Suivez d'autres utilisateurs pour voir leurs avis et photos ici.</p>
          <SuggestedUsersList />
          <Button onClick={() => navigate("/profile")} className="mt-4 rounded-full">Trouver des amis</Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-16">Chargement...</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-8">
          <MapPin size={40} className="text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground text-center">Aucune activité disponible pour cet onglet.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {items.map((item) => (
            <button key={item.id} onClick={() => navigate(`/business/${item.business_id}`)} className="w-full px-4 py-4 text-left hover:bg-accent/20 transition-colors">
              <div className="flex items-start gap-3">
                <img src={item.media_url || item.business_image_url || "/placeholder.svg"} alt={item.business_name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground truncate">{item.actor_name}</p>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">{formatRelativeTime(item.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {item.type === "review" && <Star size={12} />}
                    {item.type === "photo" && <ImageIcon size={12} />}
                    {item.type === "business" && <Store size={12} />}
                    <span className="truncate">{item.business_name}</span>
                  </div>
                  {item.body && <p className="text-sm text-foreground mt-2 line-clamp-2">{item.body}</p>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Activity;
