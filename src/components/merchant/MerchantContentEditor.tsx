import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  publicContentUrl,
  type BusinessContent,
  type ContentKind,
} from "@/lib/businessContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import OwnedBusinessPanel from "./OwnedBusinessPanel";

type EditorProps = { businessId: string; userId: string; kind: ContentKind };
const pageSize = 10;

function Editor({ businessId, userId, kind }: EditorProps) {
  const cache = useQueryClient();
  const key = ["merchant-content", userId, businessId, kind];
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<BusinessContent | "new" | null>(null);
  const [notice, setNotice] = useState("");
  const content = useQuery({
    queryKey: [...key, page],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_content")
        .select("*")
        .eq("business_id", businessId)
        .eq("kind", kind)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize);
      if (error) throw error;
      return data;
    },
  });
  if (content.isPending) return <p>Chargement…</p>;
  if (content.isError)
    return (
      <p role="alert">
        Le contenu est indisponible.{" "}
        <Button variant="outline" onClick={() => content.refetch()}>
          Réessayer
        </Button>
      </p>
    );
  const rows = content.data;
  return (
    <div className="space-y-4">
      {notice && <p role="status">{notice}</p>}
      {editing ? (
        <ContentForm
          key={editing === "new" ? "new" : editing.id}
          row={editing === "new" ? null : editing}
          businessId={businessId}
          kind={kind}
          onCancel={() => setEditing(null)}
          onSaved={async (published) => {
            await Promise.all([
              cache.invalidateQueries({ queryKey: key }),
              cache.invalidateQueries({
                queryKey: ["public-content", businessId],
              }),
            ]);
            setEditing(null);
            setPage(0);
            setNotice(
              published ? "Publication enregistrée." : "Brouillon enregistré.",
            );
          }}
        />
      ) : (
        <>
          {rows.slice(0, pageSize).map((row) => (
            <article className="rounded-xl border p-4 space-y-2" key={row.id}>
              <p className="text-xs text-muted-foreground">
                {row.is_published ? "Publié" : "Brouillon"}
              </p>
              <h2 className="font-semibold">{row.title}</h2>
              <Button
                variant="outline"
                onClick={() => {
                  setNotice("");
                  setEditing(row);
                }}
              >
                Modifier
              </Button>
            </article>
          ))}
          {(kind === "post" || !rows.length) && (
            <Button
              onClick={() => {
                setNotice("");
                setEditing("new");
              }}
            >
              {kind === "post" ? "Créer une publication" : "Créer le bouton"}
            </Button>
          )}
          {(page > 0 || rows.length > pageSize) && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                disabled={!page}
                onClick={() => setPage(page - 1)}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                disabled={rows.length <= pageSize}
                onClick={() => setPage(page + 1)}
              >
                Suivant
              </Button>
            </div>
          )}
          <Link
            className="block text-primary underline"
            to={`/business/${businessId}`}
          >
            Voir la fiche
          </Link>
        </>
      )}
    </div>
  );
}

function ContentForm({
  row,
  businessId,
  kind,
  onCancel,
  onSaved,
}: {
  row: BusinessContent | null;
  businessId: string;
  kind: ContentKind;
  onCancel: () => void;
  onSaved: (published: boolean) => Promise<void>;
}) {
  const [id] = useState(() => row?.id ?? crypto.randomUUID());
  const [title, setTitle] = useState(row?.title ?? "");
  const [body, setBody] = useState(row?.body ?? "");
  const [url, setUrl] = useState(row?.link_url ?? "");
  const [published, setPublished] = useState(row?.is_published ?? false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    const link = publicContentUrl(url.trim());
    if (
      !title.trim() ||
      (!link && url.trim()) ||
      (kind === "action" && !link)
    ) {
      setError("Vérifiez le titre et l’adresse HTTPS.");
      return;
    }
    const values = {
      title: title.trim(),
      body: body.trim(),
      link_url: link,
      is_published: published,
    };
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const table = supabase.from("business_content");
      const write = row
        ? table.update(values).eq("business_id", businessId).eq("id", id)
        : table.insert({ ...values, business_id: businessId, id, kind });
      const result = await write.select("id").single();
      if (result.error) {
        // A committed insert can lose its acknowledgement. Only accept the exact persisted draft.
        if (row || result.error.code !== "23505") throw result.error;
        const { data } = await table
          .select("*")
          .eq("id", id)
          .eq("business_id", businessId)
          .single();
        if (
          !data ||
          data.kind !== kind ||
          data.title !== values.title ||
          data.body !== values.body ||
          data.link_url !== link ||
          data.is_published !== published
        )
          throw result.error;
      }
      await onSaved(published);
    } catch {
      setError("Enregistrement impossible. Votre saisie est conservée.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="space-y-4">
      <label className="block">
        {kind === "action" ? "Texte du bouton" : "Titre"}
        <Input
          required
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="block">
        Description
        <Textarea
          maxLength={2000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>
      <label className="block">
        {kind === "action" ? "Destination HTTPS" : "Lien HTTPS (facultatif)"}
        <Input
          type="url"
          required={kind === "action"}
          maxLength={2048}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
        />
        Publier sur la fiche du commerce
      </label>
      {error && <p role="alert">{error}</p>}
      <div className="flex gap-3">
        <Button disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={onCancel}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}

export default function MerchantContentEditor({ kind }: { kind: ContentKind }) {
  return (
    <OwnedBusinessPanel
      title={kind === "action" ? "Bouton d’action" : "Publications du commerce"}
    >
      {(businessId, userId) => (
        <Editor businessId={businessId} userId={userId} kind={kind} />
      )}
    </OwnedBusinessPanel>
  );
}
