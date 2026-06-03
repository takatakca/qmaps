import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import {
  Star, Camera, MapPin, MessageCircle, Bell, Activity,
  Eye, ChevronRight, Settings, HelpCircle, Store, Briefcase
} from "lucide-react";
import foodImg from "@/assets/food-1.jpg";

const POPULAR_CITIES = ["montreal", "quebec", "laval", "gatineau"];
const POPULAR_CATEGORIES = [
  { slug: "restaurants", label: "Restaurants" },
  { slug: "cafes", label: "Cafés" },
  { slug: "salons", label: "Salons & beauté" },
  { slug: "menage", label: "Ménage" },
];

const More = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const sections = [
    {
      items: [
        { icon: Star, label: "Ajouter un avis", action: () => navigate("/") },
        { icon: Camera, label: "Ajouter une photo ou vidéo" },
        { icon: MapPin, label: "Check-in" },
        { icon: MessageCircle, label: "Messages" },
        { icon: Bell, label: "Notifications", badge: 3 },
        { icon: Activity, label: "Fil d'activité" },
        { icon: Eye, label: "Récemment consultés" },
      ],
    },
    {
      title: "QMaps pour entreprises",
      items: [
        { icon: Store, label: "Ajouter une entreprise", action: () => navigate("/merchant") },
        { icon: Star, label: "Explorer QMaps Business", action: () => navigate("/merchant") },
      ],
    },
    {
      title: "Paramètres et support",
      items: [
        { icon: Settings, label: "Paramètres" },
        { icon: HelpCircle, label: "Centre d'aide" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      {/* Banner */}
      <div className="relative h-32 overflow-hidden">
        <img src={foodImg} alt="banner" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 to-foreground/70" />
        <div className="absolute inset-0 flex items-center justify-between px-4">
          <h1 className="font-heading text-lg font-bold text-primary-foreground">Plus</h1>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-6">
        {sections.map((section, si) => (
          <div key={si}>
            {section.title && (
              <h2 className="font-heading font-semibold text-foreground mb-2 text-sm">{section.title}</h2>
            )}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={"action" in item ? (item as any).action : undefined}
                  className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-accent/50 transition-colors ${
                    i > 0 ? "border-t border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="text-muted-foreground" />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {"badge" in item && item.badge && (
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div>
          <h2 className="font-heading font-semibold text-foreground mb-2 text-sm">Découvrir QMaps</h2>
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Villes populaires</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_CITIES.map((s) => (
                  <Link
                    key={s}
                    to={`/city/${s}`}
                    className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-accent transition-colors capitalize"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Catégories</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_CATEGORIES.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/c/${c.slug}`}
                    className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-heading font-semibold text-foreground mb-2 text-sm">Légal & support</h2>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {[
              { to: "/privacy", label: "Politique de confidentialité" },
              { to: "/terms", label: "Conditions d'utilisation" },
              { to: "/cookies", label: "Témoins et suivi" },
              { to: "/account-deletion-policy", label: "Suppression de compte" },
              { to: "/support-policy", label: "Politique de support" },
              { to: "/release-notes", label: "Notes de version" },
            ].map((l, i) => (
              <Link
                key={l.to}
                to={l.to}
                className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-accent/50 transition-colors ${
                  i > 0 ? "border-t border-border" : ""
                }`}
              >
                <span className="text-sm text-foreground">{l.label}</span>
                <ChevronRight size={16} className="text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default More;
