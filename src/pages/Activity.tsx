import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronRight, Users, MapPin, Bookmark, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

type Tab = "all" | "friends" | "nearby";

const Activity = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "TOUT" },
    { key: "friends", label: "AMIS" },
    { key: "nearby", label: "À PROXIMITÉ" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card">
        <h1 className="font-heading text-xl font-bold text-foreground px-4 pt-4 pb-2">Activité</h1>
        <div className="flex border-b border-border">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
                activeTab === tab.key
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications link */}
      <button
        onClick={() => navigate("/notifications")}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-border"
      >
        <div className="flex items-center gap-3">
          <Bell size={18} className="text-muted-foreground" />
          <span className="text-sm text-foreground">Toutes les notifications</span>
        </div>
        <ChevronRight size={16} className="text-muted-foreground" />
      </button>

      {/* Content */}
      {activeTab === "all" && (
        <div className="flex flex-col items-center justify-center py-24 px-8">
          <div className="flex gap-1 mb-6">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="w-4 h-4 rounded-sm bg-primary"
                style={{ opacity: 0.3 + i * 0.2, transform: `rotate(${i * 30}deg)` }}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            L'activité récente de la communauté apparaîtra ici.
          </p>
        </div>
      )}

      {activeTab === "friends" && (
        <div className="flex flex-col items-center justify-center py-24 px-8">
          <p className="text-sm text-muted-foreground text-center mb-1">
            Cette page affichera les avis, photos et plus de vos amis QMAPS. Il semble que vous n'ayez pas encore ajouté d'amis!
          </p>
          <Button onClick={() => {}} className="mt-4 rounded-full">
            Trouver des amis
          </Button>
        </div>
      )}

      {activeTab === "nearby" && (
        <div className="flex flex-col items-center justify-center py-24 px-8">
          <MapPin size={40} className="text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground text-center">
            Les activités à proximité apparaîtront ici.
          </p>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Activity;
