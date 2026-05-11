import { NavLink, useNavigate } from "react-router-dom";
import { ShieldCheck, Flag, Building2, MessageSquare, Image as ImageIcon, Users, Briefcase, Sparkles, ArrowLeft, ShieldAlert, UserMinus, Rocket, ArrowRightLeft, ScrollText, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Tableau de bord", icon: ShieldCheck, end: true },
  { to: "/admin/reports", label: "Signalements", icon: Flag },
  { to: "/admin/claims", label: "Revendications", icon: ShieldAlert },
  { to: "/admin/owner-transfers", label: "Transferts", icon: ArrowRightLeft },
  { to: "/admin/audit-logs", label: "Audit", icon: ScrollText },
  { to: "/admin/businesses", label: "Entreprises", icon: Building2 },
  { to: "/admin/reviews", label: "Avis", icon: MessageSquare },
  { to: "/admin/review-moderation", label: "Sécurité avis", icon: ShieldAlert },
  { to: "/admin/photos", label: "Photos", icon: ImageIcon },
  { to: "/admin/projects", label: "Projets", icon: Briefcase },
  { to: "/admin/sponsored", label: "Sponsorisé", icon: Sparkles },
  { to: "/admin/users", label: "Utilisateurs", icon: Users },
  { to: "/admin/account-deletions", label: "Suppressions", icon: UserMinus },
  { to: "/admin/launch-status", label: "Lancement", icon: Rocket },
];

const AdminLayout = ({ children, title }: { children: React.ReactNode; title: string }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={20} />
          </button>
          <ShieldCheck size={20} className="text-primary" />
          <h1 className="font-heading text-lg font-bold">Admin · {title}</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 p-4">
        <aside className="md:w-56 shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
