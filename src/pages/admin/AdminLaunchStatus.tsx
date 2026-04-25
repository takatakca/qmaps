import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import Seo from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, ExternalLink, FileText } from "lucide-react";

type CheckState = "ok" | "fail" | "manual" | "unknown";

const StatusIcon = ({ state }: { state: CheckState }) => {
  if (state === "ok") return <CheckCircle2 size={18} className="text-emerald-500" />;
  if (state === "fail") return <XCircle size={18} className="text-destructive" />;
  return <AlertCircle size={18} className="text-amber-500" />;
};

const StatusBadge = ({ state }: { state: CheckState }) => {
  const map: Record<CheckState, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    ok: { label: "OK", variant: "default" },
    fail: { label: "Manquant", variant: "destructive" },
    manual: { label: "Vérif. manuelle", variant: "secondary" },
    unknown: { label: "Inconnu", variant: "outline" },
  };
  const v = map[state];
  return <Badge variant={v.variant}>{v.label}</Badge>;
};

interface CheckRow {
  label: string;
  state: CheckState;
  detail?: string;
}

const CheckCard = ({ title, rows }: { title: string; rows: CheckRow[] }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-start gap-3 py-1">
          <StatusIcon state={r.state} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm">{r.label}</span>
              <StatusBadge state={r.state} />
            </div>
            {r.detail && (
              <p className="text-xs text-muted-foreground mt-0.5 break-all">{r.detail}</p>
            )}
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

const checkUrl = async (path: string): Promise<CheckState> => {
  try {
    const res = await fetch(path, { method: "GET", cache: "no-store" });
    return res.ok ? "ok" : "fail";
  } catch {
    return "fail";
  }
};

const AdminLaunchStatus = () => {
  const [manifest, setManifest] = useState<CheckState>("unknown");
  const [robots, setRobots] = useState<CheckState>("unknown");
  const [sitemap, setSitemap] = useState<CheckState>("unknown");
  const [legal, setLegal] = useState<Record<string, CheckState>>({});

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;

  const buildDate = (import.meta.env.VITE_BUILD_DATE as string | undefined) || "unknown";
  const appVersion = (import.meta.env.VITE_APP_VERSION as string | undefined) || "unknown";

  const legalRoutes = [
    "/privacy",
    "/terms",
    "/cookies",
    "/account-deletion-policy",
    "/support-policy",
  ];

  useEffect(() => {
    void (async () => {
      setManifest(await checkUrl("/manifest.webmanifest"));
      setRobots(await checkUrl("/robots.txt"));
      // Sitemap is a SPA route; HEAD will 200 via SPA fallback. Treat presence
      // of route in App.tsx as the truth — verify by attempting a GET.
      setSitemap(await checkUrl("/sitemap.xml"));
      const legalResults: Record<string, CheckState> = {};
      for (const r of legalRoutes) {
        legalResults[r] = await checkUrl(r);
      }
      setLegal(legalResults);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const envState: CheckState = supabaseUrl && supabaseKey ? "ok" : "fail";

  const docs = [
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

        <CheckCard
          title="PWA & SEO"
          rows={[
            { label: "Manifest (/manifest.webmanifest)", state: manifest },
            { label: "robots.txt", state: robots },
            { label: "sitemap.xml", state: sitemap },
          ]}
        />

        <CheckCard
          title="Pages légales publiques"
          rows={legalRoutes.map((r) => ({
            label: r,
            state: legal[r] ?? "unknown",
          }))}
        />

        <CheckCard
          title="Environnement (client)"
          rows={[
            {
              label: "VITE_SUPABASE_URL",
              state: supabaseUrl ? "ok" : "fail",
              detail: supabaseUrl ? supabaseUrl : "Non défini",
            },
            {
              label: "VITE_SUPABASE_PUBLISHABLE_KEY",
              state: supabaseKey ? "ok" : "fail",
              detail: supabaseKey ? "défini" : "Non défini",
            },
            {
              label: "VITE_SUPABASE_PROJECT_ID",
              state: projectId ? "ok" : "fail",
              detail: projectId || "Non défini",
            },
            {
              label: "Backend prêt",
              state: envState,
            },
          ]}
        />

        <CheckCard
          title="Stripe / facturation"
          rows={[
            {
              label: "Configuration Stripe (clé secrète, webhook)",
              state: "manual",
              detail: "Vérifier dans les secrets des fonctions edge.",
            },
            {
              label: "Webhook stripe-webhook joignable",
              state: "manual",
            },
          ]}
        />

        <CheckCard
          title="Tests & build"
          rows={[
            { label: "bunx vitest run", state: "manual", detail: "Lancer localement / en CI." },
            { label: "bun run build", state: "manual", detail: "Lancer localement / en CI." },
            { label: "GitHub Actions CI vert", state: "manual" },
          ]}
        />

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
