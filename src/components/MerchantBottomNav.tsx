import { useLocation, useNavigate } from "react-router-dom";
import { Home, Megaphone, Store, MessageSquare, Bell, Menu } from "lucide-react";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";

const tabs = [
  { path: "/merchant/home", icon: Home, label: "Accueil" },
  { path: "/merchant/optimization", icon: Megaphone, label: "Optimiser" },
  { path: "/merchant/marketplace", icon: Store, label: "Vitrine" },
  { path: "/merchant/messages", icon: MessageSquare, label: "Messages" },
  { path: "/merchant/notifications", icon: Bell, label: "Alertes" },
  { path: "/merchant/more", icon: Menu, label: "Menu" },
];

const MerchantBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Live unread counts. Messages = real unread from conversation_participants/messages.
  // Notifications = real unread row count from `notifications` table. The table exists
  // and is RLS-protected; until server-side producers are wired in, the count will be
  // 0 for most merchants — we never fake counts.
  const { unreadMessages, unreadNotifications } = useUnreadCounts();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border shadow-elevated pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const badge =
            tab.path === "/merchant/messages"
              ? unreadMessages
              : tab.path === "/merchant/notifications"
                ? unreadNotifications
                : 0;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px] min-h-[44px] transition-all ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-brand-gradient" />
              )}
              <div className={`relative flex items-center justify-center rounded-xl transition-all ${active ? "bg-secondary px-2.5 py-1" : "px-1 py-1"}`}>
                <tab.icon size={20} strokeWidth={active ? 2.5 : 1.75} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 shadow-soft">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MerchantBottomNav;
