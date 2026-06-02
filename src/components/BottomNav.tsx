import { useLocation, useNavigate } from "react-router-dom";
import { Search, ClipboardList, Bookmark, User, MoreHorizontal } from "lucide-react";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";

const tabs = [
  { path: "/", icon: Search, label: "Recherche" },
  { path: "/projects", icon: ClipboardList, label: "Projets" },
  { path: "/profile", icon: User, label: "Moi" },
  { path: "/collections", icon: Bookmark, label: "Collections" },
  { path: "/more", icon: MoreHorizontal, label: "Plus" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadNotifications, unreadMessages } = useUnreadCounts();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border shadow-elevated pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const badge = tab.path === "/more" ? unreadNotifications : tab.path === "/profile" ? unreadMessages : 0;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex flex-col items-center gap-0.5 py-2 px-3 min-w-[60px] min-h-[44px] transition-all ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-brand-gradient" />
              )}
              <div className={`relative flex items-center justify-center rounded-xl transition-all ${isActive ? "bg-secondary px-2.5 py-1" : "px-1 py-1"}`}>
                <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow-soft">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
