import { useNavigate } from "react-router-dom";
import {
  Crown, Link2, MousePointerClick, Sparkles, Image,
  Film, ShieldX, Star, Camera, Lock, ChevronRight, X, Users
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const enhanceItems = [
  { icon: Link2, label: "QMAPS Connect", route: "/merchant/connect", locked: false },
  { icon: MousePointerClick, label: "Appel à l'action", route: "/merchant/cta", locked: false },
  { icon: Sparkles, label: "Points forts", route: "/merchant/highlights", locked: false },
  { icon: Image, label: "Logo", route: "/merchant/photos", locked: false },
  { icon: Film, label: "Diaporama", route: "/merchant/photos", locked: true },
  { icon: ShieldX, label: "Retirer pubs concurrents", route: "/merchant/optimization", locked: true },
];

const shortcuts = [
  { icon: Star, label: "Avis", route: "/merchant" },
  { icon: Camera, label: "Photos & Vidéos", route: "/merchant/photos" },
  { icon: Users, label: "QMAPS Guest Manager", route: "/merchant/guest-manager" },
];

const EnhanceSection = () => {
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(true);

  return (
    <>
      {/* Upgrade banner */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="bg-primary/5 px-3 py-1.5">
          <span className="text-[11px] font-bold text-primary uppercase tracking-wide flex items-center gap-1">
            <Crown size={12} /> Mise à niveau
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-heading font-bold text-foreground mb-1">Améliorez votre page</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Ces fonctionnalités peuvent améliorer votre page QMAPS et renforcer l'attrait de votre entreprise.
          </p>

          {showBanner && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-3 flex items-start gap-2">
              <Sparkles size={16} className="text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-foreground">Accédez aux fonctionnalités améliorées avec le forfait Upgrade.</p>
                <button onClick={() => navigate("/merchant/optimization")} className="text-xs text-primary font-semibold mt-1">
                  Économisez avec le forfait →
                </button>
              </div>
              <button onClick={() => setShowBanner(false)} className="text-muted-foreground p-0.5">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Enhancement tools */}
          <div className="space-y-1">
            {enhanceItems.map((item, i) => (
              <div key={i}>
                <button
                  onClick={() => !item.locked && navigate(item.route)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors ${item.locked ? "opacity-60" : "hover:bg-accent/30"}`}
                >
                  <item.icon size={18} className="text-foreground shrink-0" />
                  <span className="text-sm text-foreground flex-1 text-left">{item.label}</span>
                  {item.locked ? (
                    <Lock size={14} className="text-muted-foreground" />
                  ) : (
                    <ChevronRight size={14} className="text-muted-foreground" />
                  )}
                </button>
                {item.locked && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 pl-9">Disponible avec le forfait Upgrade</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="space-y-1">
        {shortcuts.map((s, i) => (
          <button
            key={i}
            onClick={() => navigate(s.route)}
            className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:bg-accent/30 transition-colors"
          >
            <s.icon size={18} className="text-foreground" />
            <span className="text-sm font-medium text-foreground flex-1 text-left">{s.label}</span>
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
        ))}
      </div>
    </>
  );
};

export default EnhanceSection;
