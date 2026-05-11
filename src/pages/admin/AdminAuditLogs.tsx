import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADMIN_AUDIT_ACTION_LABELS, ADMIN_AUDIT_ACTIONS, summarizeAuditLogs } from "@/lib/adminAudit";

interface AuditRow {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const AdminAuditLogs = () => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [targetFilter, setTargetFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    let q = (supabase as any)
      .from("admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (actionFilter !== "all") q = q.eq("action", actionFilter);
    if (targetFilter !== "all") q = q.eq("target_type", targetFilter);
    const { data } = await q;
    setRows((data as AuditRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [actionFilter, targetFilter]);

  const targetTypes = Array.from(new Set(rows.map((r) => r.target_type))).sort();
  const summary = summarizeAuditLogs(rows);

  return (
    <AdminLayout title="Journal d'audit">
      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les actions</SelectItem>
            {ADMIN_AUDIT_ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>{ADMIN_AUDIT_ACTION_LABELS[a]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={targetFilter} onValueChange={setTargetFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les cibles</SelectItem>
            {targetTypes.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="p-3 mb-4">
        <p className="text-xs text-muted-foreground mb-1">Résumé (vue actuelle)</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(summary).length === 0 ? (
            <span className="text-xs text-muted-foreground">Aucune action</span>
          ) : (
            Object.entries(summary).map(([k, v]) => (
              <span key={k} className="text-xs px-2 py-1 rounded-full bg-secondary">
                {ADMIN_AUDIT_ACTION_LABELS[k as never] ?? k}: {v}
              </span>
            ))
          )}
        </div>
      </Card>

      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">Aucune entrée.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r.id} className="p-3 text-sm">
              <div className="flex justify-between gap-2 flex-wrap">
                <span className="font-medium">
                  {ADMIN_AUDIT_ACTION_LABELS[r.action as never] ?? r.action}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("fr-CA")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {r.target_type} {r.target_id ? `· ${r.target_id}` : ""}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono mt-1">
                admin: {r.admin_user_id}
              </p>
              {r.metadata && Object.keys(r.metadata).length > 0 && (
                <pre className="text-[10px] mt-2 p-2 bg-muted rounded overflow-x-auto">
                  {JSON.stringify(r.metadata, null, 2)}
                </pre>
              )}
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAuditLogs;
