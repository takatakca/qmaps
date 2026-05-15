import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, LogOut, AlertCircle, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { STATUS_LABELS_FR, type AccountDeletionStatus } from "@/lib/accountDeletion";

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
  { label: "Fermer le compte", path: "/settings/delete-account", danger: true },
];

interface PendingRequest {
  id: string;
  status: AccountDeletionStatus;
  requested_at: string;
}

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut, isMerchant } = useAuth();
  const [pending, setPending] = useState<PendingRequest | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("account_deletion_requests")
      .select("id, status, requested_at")
      .eq("user_id", user.id)
      .in("status", ["pending", "processing"])
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setPending((data as PendingRequest) ?? null));
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground">Paramètres</h1>
      </div>

      {pending && (
        <button
          onClick={() => navigate("/settings/delete-account")}
          className="w-full text-left mx-4 mt-4 mb-2 bg-destructive/5 border border-destructive/20 rounded-xl p-3 flex items-start gap-3 hover:bg-destructive/10 transition-colors"
          style={{ width: "calc(100% - 2rem)" }}
        >
          <AlertCircle size={18} className="text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-destructive">
              Demande de fermeture de compte active
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Statut : {STATUS_LABELS_FR[pending.status]} · Soumise le{" "}
              {new Date(pending.requested_at).toLocaleDateString("fr-CA")}
            </p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground shrink-0 mt-0.5" />
        </button>
      )}

      {/* Phase 6: Switch to merchant view (only when user holds merchant role) */}
      {isMerchant && (
        <button
          onClick={() => navigate("/merchant")}
          className="w-full flex items-center justify-between px-4 py-4 hover:bg-accent/30 transition-colors border-b border-border"
        >
          <span className="flex items-center gap-3 text-sm font-medium text-foreground">
            <Building2 size={18} className="text-primary" />
            Passer en espace professionnel
          </span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
      )}

      <div className="divide-y divide-border">
        {settingsItems.map((item, i) => (
          <button
            key={i}
            onClick={() => item.path && navigate(item.path)}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-accent/30 transition-colors"
          >
            <span className={`text-sm ${item.danger ? "text-destructive font-medium" : "text-foreground"}`}>
              {item.label}
            </span>
            <ChevronRight size={16} className="text-muted-foreground" />
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
          <button onClick={() => navigate("/terms")} className="text-primary">Conditions d'utilisation</button>,{" "}
          <button onClick={() => navigate("/privacy")} className="text-primary">Politique de confidentialité</button>,{" "}
          <button onClick={() => navigate("/cookies")} className="text-primary">Témoins</button>,{" "}
          <button onClick={() => navigate("/account-deletion-policy")} className="text-primary">Suppression de compte</button> et{" "}
          <button onClick={() => navigate("/support-policy")} className="text-primary">Support</button>
        </p>
        <p className="text-xs text-muted-foreground">Copyright © 2024–2026 QMAPS Inc.</p>
        <p className="text-xs text-muted-foreground">QMAPS v1.0.0</p>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
