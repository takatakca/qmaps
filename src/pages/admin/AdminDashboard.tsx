import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Flag, Building2, MessageSquare, Briefcase, ShieldAlert } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    openReports: 0,
    pendingClaims: 0,
    pendingClaimRequests: 0,
    recentReviews: 0,
    recentBusinesses: 0,
    recentProjects: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [reports, claims, claimRequests, reviews, businesses, projects] = await Promise.all([
        supabase.from("reports" as any).select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("business_claims").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("business_claim_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("reviews").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("businesses").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("project_requests").select("id", { count: "exact", head: true }).gte("created_at", since),
      ]);
      setStats({
        openReports: reports.count || 0,
        pendingClaims: claims.count || 0,
        pendingClaimRequests: claimRequests.count || 0,
        recentReviews: reviews.count || 0,
        recentBusinesses: businesses.count || 0,
        recentProjects: projects.count || 0,
      });
      setLoading(false);
    };
    void load();
  }, []);

  const cards = [
    { label: "Signalements ouverts", value: stats.openReports, icon: Flag, to: "/admin/reports", tone: "text-destructive" },
    { label: "Réclamations en attente", value: stats.pendingClaims, icon: ShieldAlert, to: "/admin/businesses", tone: "text-amber-600" },
    { label: "Demandes structurées", value: stats.pendingClaimRequests, icon: ShieldAlert, to: "/admin/claims", tone: "text-amber-600" },
    { label: "Avis (7j)", value: stats.recentReviews, icon: MessageSquare, to: "/admin/reviews", tone: "text-foreground" },
    { label: "Entreprises (7j)", value: stats.recentBusinesses, icon: Building2, to: "/admin/businesses", tone: "text-foreground" },
    { label: "Projets (7j)", value: stats.recentProjects, icon: Briefcase, to: "/admin/projects", tone: "text-foreground" },
  ];

  return (
    <AdminLayout title="Tableau de bord">
      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : (
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
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
