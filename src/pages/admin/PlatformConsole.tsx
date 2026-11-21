import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const sections = [
  ["/admin/businesses", "Commerces"], ["/admin/users", "Utilisateurs"],
  ["/admin/claims", "Revendications"], ["/admin/review-moderation", "Modération des avis"],
  ["/admin/reports", "Signalements"], ["/admin/audit-logs", "Journal d’audit"],
];

export default function PlatformConsole() {
  const { user } = useAuth();
  const release = useQuery({
    queryKey: ["console-release"],
    queryFn: async () => {
      const response = await fetch("/qmaps-release.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Manifeste indisponible");
      const { sha } = await response.json();
      if (typeof sha !== "string" || !/^[a-f0-9]{40}$/.test(sha)) throw new Error("Version inconnue");
      return sha;
    },
  });
  const catalogue = useQuery({
    queryKey: ["console-catalogue", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase.from("businesses").select("id", { count: "exact", head: true }).eq("is_active", true).throwOnError();
      return count ?? 0;
    },
  });
  const studio = import.meta.env.VITE_QMAPS_STUDIO_URL;
  return (
    <AdminLayout title="Console QMAPS">
      <section className="space-y-5">
        <h2 className="font-heading text-xl font-bold">État de la plateforme</h2>
        <dl className="grid gap-3 md:grid-cols-2">
          <Card className="p-4">
            <dt className="text-sm text-muted-foreground">Catalogue public</dt>
            <dd className="mt-1 font-semibold">{catalogue.isLoading ? "Chargement…" : catalogue.isError ? "Lecture indisponible" : `${catalogue.data} fiches actives`}</dd>
          </Card>
          <Card className="p-4">
            <dt className="text-sm text-muted-foreground">Version de QMAPS.ca</dt>
            <dd className="mt-1 font-mono">{release.data ? <a className="underline" href={`https://github.com/takatakca/qmaps/commit/${release.data}`}>{release.data.slice(0, 12)}</a> : release.isError ? "Indisponible" : "Chargement…"}</dd>
          </Card>
        </dl>
        <p className="break-all text-sm">Serveur de données · {new URL(import.meta.env.VITE_SUPABASE_URL).host}</p>
        <Button variant="outline" onClick={() => { void release.refetch(); void catalogue.refetch(); }}>Actualiser</Button>
        <h2 className="font-heading text-xl font-bold">Administration</h2>
        <nav className="grid gap-3 sm:grid-cols-2">
          {sections.map(([path, label]) => <Link className="rounded-lg border p-3 font-semibold hover:text-primary" key={path} to={path}>{label}</Link>)}
          {studio && /^https:\/\//.test(studio) && <a className="rounded-lg border p-3 font-semibold" href={studio} target="_blank" rel="noopener noreferrer">Console de la base de données</a>}
        </nav>
      </section>
    </AdminLayout>
  );
}
