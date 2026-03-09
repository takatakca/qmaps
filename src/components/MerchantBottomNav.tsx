import { useLocation, useNavigate } from "react-router-dom";
import { Home, Megaphone, Store, MessageSquare, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const tabs = [
  { path: "/merchant/home", icon: Home, label: "Accueil" },
  { path: "/merchant/optimization", icon: Megaphone, label: "Optimiser" },
  { path: "/merchant/marketplace", icon: Store, label: "Vitrine" },
  { path: "/merchant/messages", icon: MessageSquare, label: "Messages" },
  { path: "/merchant/notifications", icon: Bell, label: "Alertes" },
];

const MerchantBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  // For now, badge counts are placeholder — will be dynamic once messaging/notification tables exist
  useEffect(() => {
    // Placeholder badge logic
    setUnreadMessages(0);
    setUnreadNotifs(0);
  }, [user]);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const badge = tab.path === "/merchant/messages" ? unreadMessages : tab.path === "/merchant/notifications" ? unreadNotifs : 0;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`relative flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px] transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <tab.icon size={22} strokeWidth={active ? 2.5 : 1.5} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MerchantBottomNav;
