import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Seo from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, ExternalLink, FileText } from "lucide-react";
import {
  LAUNCH_CHECK_GROUPS,
  computeEnvStates,
  type LaunchCheckItem,
  type LaunchCheckState,
} from "@/lib/launchChecks";

const StatusIcon = ({ state }: { state: LaunchCheckState }) => {
  if (state === "ok") return <CheckCircle2 size={18} className="text-primary" />;
  if (state === "fail") return <XCircle size={18} className="text-destructive" />;
  return <AlertCircle size={18} className="text-muted-foreground" />;
};

const StatusBadge = ({ state }: { state: LaunchCheckState }) => {
  const map: Record<LaunchCheckState, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ok: { label: "OK", variant: "default" },
    fail: { label: "Manquant", variant: "destructive" },
    manual: { label: "Vérif. manuelle", variant: "secondary" },
    unknown: { label: "Inconnu", variant: "outline" },
  };
  const v = map[state];
  return <Badge variant={v.variant}>{v.label}</Badge>;
};

const CheckCard = ({
  title,
  items,
  states,
}: {
  title: string;
  items: LaunchCheckItem[];
  states: Record<string, LaunchCheckState>;
}) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {items.map((it) => {
        const state = states[it.id] ?? it.defaultState;
        return (
          <div key={it.id} className="flex items-start gap-3 py-1">
            <StatusIcon state={state} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">{it.label}</span>
                <StatusBadge state={state} />
              </div>
              {it.detail && (
                <p className="text-xs text-muted-foreground mt-0.5 break-all">{it.detail}</p>
              )}
            </div>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

const checkUrl = async (path: string): Promise<LaunchCheckState> => {
  try {
    const res = await fetch(path, { method: "GET", cache: "no-store" });
    return res.ok ? "ok" : "fail";
  } catch {
    return "fail";
  }
};

const AdminLaunchStatus = () => {
  const [runtimeStates, setRuntimeStates] = useState<Record<string, LaunchCheckState>>({});

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;

  const buildDate = (import.meta.env.VITE_BUILD_DATE as string | undefined) || "unknown";
  const appVersion = (import.meta.env.VITE_APP_VERSION as string | undefined) || "unknown";

  const envStates = useMemo(
    () => computeEnvStates({ supabaseUrl, supabaseKey, projectId }),
    [supabaseUrl, supabaseKey, projectId],
  );

  useEffect(() => {
    void (async () => {
      const next: Record<string, LaunchCheckState> = {};
      for (const group of LAUNCH_CHECK_GROUPS) {
        if (group.id !== "pwa" && group.id !== "legal") continue;
        for (const item of group.items) {
          if (item.path) {
            next[item.id] = await checkUrl(item.path);
          }
        }
      }
      setRuntimeStates(next);
    })();
  }, []);

  const states: Record<string, LaunchCheckState> = {
    ...runtimeStates,
    ...envStates,
  };

  const docs = [
    { label: "Release-candidate checklist", path: "docs/release-candidate-checklist.md" },
    { label: "Launch checklist", path: "docs/launch-checklist.md" },
    { label: "Deployment checklist", path: "docs/deployment-checklist.md" },
    { label: "Environment setup", path: "docs/environment-setup.md" },
    { label: "App store readiness", path: "docs/app-store-readiness.md" },
  ];

  return (
    <AdminLayout title="Statut de lancement">
      <Seo
        title="Admin · Statut de lancement"
        description="Tableau de bord de vérification pour le lancement en production."
        noindex
      />

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Build</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">Version</div>
              <div className="font-mono">{appVersion}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Date du build</div>
              <div className="font-mono">{buildDate}</div>
            </div>
          </CardContent>
        </Card>

        {LAUNCH_CHECK_GROUPS.map((group) => (
          <CheckCard
            key={group.id}
            title={group.title}
            items={group.items}
            states={states}
          />
        ))}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Documentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {docs.map((d) => (
              <div key={d.path} className="flex items-center gap-2 text-sm">
                <FileText size={16} className="text-muted-foreground" />
                <span className="font-mono text-xs">{d.path}</span>
                <ExternalLink size={12} className="text-muted-foreground" />
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-2">
              Ces fichiers vivent dans le dépôt et doivent être consultés via votre éditeur ou GitHub.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminLaunchStatus;
