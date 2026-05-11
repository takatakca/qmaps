import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Flag, Building2, MessageSquare, Briefcase, ShieldAlert, ArrowRightLeft, ScrollText, ListChecks, Tag } from "lucide-react";
import { ADMIN_AUDIT_ACTION_LABELS } from "@/lib/adminAudit";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    openReports: 0,
    pendingClaims: 0,
    pendingClaimRequests: 0,
    pendingOwnerTransfers: 0,
    recentReviews: 0,
    recentBusinesses: 0,
    recentProjects: 0,
  });
  const [recentAudits, setRecentAudits] = useState<{ id: string; action: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [reports, claims, claimRequests, transfers, reviews, businesses, projects, audits] = await Promise.all([
        supabase.from("reports" as any).select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("business_claims").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("business_claim_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("business_owner_transfer_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("reviews").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("businesses").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("project_requests").select("id", { count: "exact", head: true }).gte("created_at", since),
        (supabase as any).from("admin_audit_logs").select("id, action, created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({
        openReports: reports.count || 0,
        pendingClaims: claims.count || 0,
        pendingClaimRequests: claimRequests.count || 0,
        pendingOwnerTransfers: transfers.count || 0,
        recentReviews: reviews.count || 0,
        recentBusinesses: businesses.count || 0,
        recentProjects: projects.count || 0,
      });
      setRecentAudits((audits.data as any) ?? []);
      setLoading(false);
    };
    void load();
  }, []);

  const cards = [
    { label: "Signalements ouverts", value: stats.openReports, icon: Flag, to: "/admin/reports", tone: "text-destructive" },
    { label: "Réclamations en attente", value: stats.pendingClaims, icon: ShieldAlert, to: "/admin/businesses", tone: "text-amber-600" },
    { label: "Demandes structurées", value: stats.pendingClaimRequests, icon: ShieldAlert, to: "/admin/claims", tone: "text-amber-600" },
    { label: "Transferts en attente", value: stats.pendingOwnerTransfers, icon: ArrowRightLeft, to: "/admin/owner-transfers", tone: "text-amber-600" },
    { label: "Avis (7j)", value: stats.recentReviews, icon: MessageSquare, to: "/admin/reviews", tone: "text-foreground" },
    { label: "Entreprises (7j)", value: stats.recentBusinesses, icon: Building2, to: "/admin/businesses", tone: "text-foreground" },
    { label: "Projets (7j)", value: stats.recentProjects, icon: Briefcase, to: "/admin/projects", tone: "text-foreground" },
  ];

  const quickLinks = [
    { label: "Revendications", to: "/admin/claims" },
    { label: "Transferts propriétaire", to: "/admin/owner-transfers" },
    { label: "Signalements", to: "/admin/reports" },
    { label: "Journal d'audit", to: "/admin/audit-logs" },
    { label: "Commerces", to: "/admin/businesses" },
    { label: "Statut de lancement", to: "/admin/launch-status" },
  ];

  return (
    <AdminLayout title="Tableau de bord">
      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cards.map((c) => (
              <Link key={c.label} to={c.to}>
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{c.label}</p>
                      <p className={`text-3xl font-bold mt-1 ${c.tone}`}>{c.value}</p>
                    </div>
                    <c.icon size={24} className="text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <Card className="p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks size={16} />
              <h3 className="font-semibold">Liens rapides</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickLinks.map((q) => (
                <Link key={q.to} to={q.to} className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-secondary transition-colors">
                  {q.label}
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <ScrollText size={16} />
              <h3 className="font-semibold">Actions admin récentes</h3>
            </div>
            {recentAudits.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune action récente.</p>
            ) : (
              <ul className="space-y-1">
                {recentAudits.map((a) => (
                  <li key={a.id} className="text-sm flex justify-between gap-2">
                    <span>{ADMIN_AUDIT_ACTION_LABELS[a.action as never] ?? a.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString("fr-CA")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/admin/audit-logs" className="text-xs text-primary mt-2 inline-block">Voir tout →</Link>
          </Card>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
