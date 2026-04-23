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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const badge = tab.path === "/more" ? unreadNotifications : tab.path === "/profile" ? unreadMessages : 0;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 min-w-[60px] transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <tab.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              {badge > 0 && <span className="absolute mt-[-6px] ml-5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">{badge > 9 ? "9+" : badge}</span>}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
