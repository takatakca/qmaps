import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";

const settingsItems = [
  { label: "Notifications push", path: "" },
  { label: "Notifications email", path: "/settings/email-notifications" },
  { label: "Mes emplacements", path: "/settings/my-locations" },
  { label: "Services de localisation", path: "/settings/location-services" },
  { label: "Effacer l'historique", path: "/settings/clear-history" },
  { label: "Unités de distance", path: "/settings/distance-units" },
  { label: "Paramètres de confidentialité", path: "/settings/privacy" },
  { label: "Paramètres de sécurité", path: "" },
  { label: "Préférences de l'app", path: "/settings/app-preferences" },
  { label: "Fermer le compte", path: "", danger: true },
];

const Settings = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [clearing, setClearing] = useState(false);

  const handleItem = (item: typeof settingsItems[0]) => {
    if (item.label === "Effacer l'historique") {
      setClearing(true);
      setTimeout(() => setClearing(false), 1500);
      return;
    }
    if (item.path) navigate(item.path);
  };

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground">Paramètres</h1>
      </div>

      <div className="divide-y divide-border">
        {settingsItems.map((item, i) => (
          <button
            key={i}
            onClick={() => handleItem(item)}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-accent/30 transition-colors"
          >
            <span className={`text-sm ${item.danger ? "text-destructive font-medium" : "text-foreground"}`}>
              {item.label}
            </span>
            {!item.action && <ChevronRight size={16} className="text-muted-foreground" />}
          </button>
        ))}
      </div>

      <button
        onClick={async () => { await signOut(); navigate("/"); }}
        className="w-full flex items-center gap-3 px-4 py-4 border-t border-border"
      >
        <LogOut size={18} className="text-destructive" />
        <span className="text-sm font-medium text-destructive">Se déconnecter</span>
      </button>

      <div className="px-4 py-6 text-center space-y-1">
        <p className="text-xs text-muted-foreground">
          <button className="text-primary">Conditions d'utilisation</button>,{" "}
          <button className="text-primary">Politique de confidentialité</button> et{" "}
          <button className="text-primary">Directives de contenu</button>
        </p>
        <p className="text-xs text-muted-foreground">Copyright © 2024–2026 QMAPS Inc.</p>
        <p className="text-xs text-muted-foreground">QMAPS v1.0.0</p>
      </div>

      {clearing && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 shadow-lg text-center">
            <p className="text-sm text-foreground">Historique effacé ✓</p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Settings;
