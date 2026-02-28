import BottomNav from "@/components/BottomNav";
import { Settings, Star, Camera, Heart, MapPin, Bookmark, Mail, Activity, Calendar, ChevronRight } from "lucide-react";

const Profile = () => {
  const menuItems = [
    { icon: Heart, label: "Vos préférences" },
    { icon: Star, label: "Avis", badge: "1" },
    { icon: MapPin, label: "Entreprises ajoutées", badge: "0" },
    { icon: Mail, label: "Messages" },
    { icon: Activity, label: "Mon activité" },
    { icon: Calendar, label: "Réservations" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-6 px-4">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-3">
          <span className="text-2xl font-heading font-bold text-secondary-foreground">Q</span>
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground">Utilisateur QMaps</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Montréal, QC, Canada</p>

        {/* Quick Actions */}
        <div className="flex gap-6 mt-5">
          {[
            { icon: Star, label: "Ajouter avis" },
            { icon: Camera, label: "Ajouter photo" },
            { icon: MapPin, label: "Check-in" },
            { icon: Bookmark, label: "Sauvegarder" },
          ].map((action) => (
            <button key={action.label} className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center">
                <action.icon size={18} className="text-foreground" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* My Impact */}
      <div className="px-4">
        <h2 className="font-heading font-semibold text-foreground mb-3">Mon impact</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground">réactions</p>
            <p className="text-2xl font-heading font-bold text-foreground mt-1">2</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground">vues 90 jours</p>
            <p className="text-2xl font-heading font-bold text-foreground mt-1">1</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 mt-6">
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-accent/50 transition-colors ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} className="text-muted-foreground" />
                <span className="text-sm text-foreground font-medium">{item.label}</span>
                {item.badge && (
                  <span className="text-xs text-muted-foreground">{item.badge}</span>
                )}
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
