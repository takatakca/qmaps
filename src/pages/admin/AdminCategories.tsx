import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  normalizeCategoryInput,
  validateCategoryInput,
  sortCategories,
  slugifyCategoryName,
  type CategoryInput,
} from "@/lib/categories";
import { buildAdminAuditLogPayload, type AdminAuditAction } from "@/lib/adminAudit";

interface Row {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: string | null;
  is_active: boolean;
  sort_order: number;
  category_type: string;
}

const empty: CategoryInput = { name: "", slug: "", icon: "", parent_id: null, is_active: true, sort_order: 0 };

type LevelFilter = "all" | "root" | "child";
type TypeFilter = "all" | string;
const PAGE_SIZE_UI = 50;

const AdminCategories = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [parentFilter, setParentFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<CategoryInput>(empty);
  const { toast } = useToast();
  const { user } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    // Paginated fetch — DB holds 1100+ categories; Supabase caps each query at 1000 rows.
    const pageSize = 1000;
    const all: Row[] = [];
    let from = 0;
    // Safety cap: 20 pages = 20k rows
    try {
      for (let i = 0; i < 20; i++) {
        const { data, error } = await (supabase as any)
          .from("categories")
          .select("id,name,slug,icon,parent_id,is_active,sort_order,category_type")
          .order("sort_order", { ascending: true })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        const batch = (data as Row[]) ?? [];
        all.push(...batch);
        if (batch.length < pageSize) break;
        from += pageSize;
      }
      setRows(all);
    } catch (e: any) {
      setLoadError(e?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const audit = async (action: AdminAuditAction, targetId: string, metadata: Record<string, unknown> = {}) => {
    if (!user) return;
    await (supabase as any).from("admin_audit_logs").insert(
      buildAdminAuditLogPayload({ adminUserId: user.id, action, targetType: "category", targetId, metadata }),
    );
  };

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (r: Row) => {
    setEditing(r);
    setForm({ name: r.name, slug: r.slug, icon: r.icon ?? "", parent_id: r.parent_id, is_active: r.is_active, sort_order: r.sort_order });
    setOpen(true);
  };

  const submit = async () => {
    const normalized = normalizeCategoryInput(form);
    const v = validateCategoryInput(normalized, { id: editing?.id });
    if (!v.ok) { toast({ title: "Validation", description: v.errors.join(" "), variant: "destructive" }); return; }
    if (editing) {
      const { error } = await (supabase as any).from("categories").update(normalized).eq("id", editing.id);
      if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
      await audit("category_updated", editing.id, { changes: normalized });
      toast({ title: "Catégorie mise à jour" });
    } else {
      const { data, error } = await (supabase as any).from("categories").insert(normalized).select("id").single();
      if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
      await audit("category_created", data.id, { name: normalized.name, slug: normalized.slug });
      toast({ title: "Catégorie créée" });
    }
    setOpen(false);
    void load();
  };

  const toggleActive = async (r: Row) => {
    const next = !r.is_active;
    const { error } = await (supabase as any).from("categories").update({ is_active: next }).eq("id", r.id);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    await audit(next ? "category_reactivated" : "category_deactivated", r.id, {});
    toast({ title: next ? "Catégorie réactivée" : "Catégorie désactivée" });
    void load();
  };

  const typeOptions = Array.from(new Set(rows.map((r) => r.category_type).filter(Boolean))).sort();
  const rootOptions = sortCategories(rows.filter((r) => !r.parent_id));

  const filteredAll = sortCategories(
    rows.filter((r) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const parent = r.parent_id ? rows.find((p) => p.id === r.parent_id) : null;
        const hay = [r.name, r.slug, r.category_type, parent?.name, parent?.slug]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (levelFilter === "root" && r.parent_id) return false;
      if (levelFilter === "child" && !r.parent_id) return false;
      if (typeFilter !== "all" && r.category_type !== typeFilter) return false;
      if (parentFilter !== "all") {
        if (parentFilter === "__none__") {
          if (r.parent_id) return false;
        } else if (r.parent_id !== parentFilter) {
          return false;
        }
      }
      return true;
    }),
  );

  const totalPages = Math.max(1, Math.ceil(filteredAll.length / PAGE_SIZE_UI));
  const safePage = Math.min(page, totalPages);
  const filtered = filteredAll.slice((safePage - 1) * PAGE_SIZE_UI, safePage * PAGE_SIZE_UI);

  const parentOptions = rows.filter((r) => r.id !== editing?.id);

  return (
    <AdminLayout title="Catégories">
      <div className="flex flex-wrap gap-2 mb-3">
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Rechercher (nom, slug, parent, type)…"
          className="flex-1 min-w-[200px]"
        />
        <Button onClick={openCreate}>Nouvelle catégorie</Button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4 text-sm">
        <select
          className="border border-border rounded-md px-2 py-1 bg-background"
          value={levelFilter}
          onChange={(e) => { setLevelFilter(e.target.value as LevelFilter); setPage(1); }}
        >
          <option value="all">Tous niveaux</option>
          <option value="root">Racines uniquement</option>
          <option value="child">Sous-catégories</option>
        </select>
        <select
          className="border border-border rounded-md px-2 py-1 bg-background"
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
        >
          <option value="all">Tous types</option>
          {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          className="border border-border rounded-md px-2 py-1 bg-background min-w-[180px]"
          value={parentFilter}
          onChange={(e) => { setParentFilter(e.target.value); setPage(1); }}
        >
          <option value="all">Tout parent</option>
          <option value="__none__">— Sans parent —</option>
          {rootOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <span className="text-xs text-muted-foreground self-center ml-auto">
          {filteredAll.length} / {rows.length} catégories
        </span>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : loadError ? (
        <Card className="p-6 text-center space-y-3">
          <p className="text-destructive text-sm">Erreur : {loadError}</p>
          <Button size="sm" variant="outline" onClick={() => void load()}>Réessayer</Button>
        </Card>
      ) : filteredAll.length === 0 ? (
        <Card className="p-8 text-center"><p className="text-muted-foreground">Aucune catégorie ne correspond à ces filtres.</p></Card>
      ) : (
        <>
        <div className="space-y-2">
          {filtered.map((r) => {
            const parent = rows.find((p) => p.id === r.parent_id);
            return (
              <Card key={r.id} className="p-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{r.name}</span>
                    <Badge variant="outline">{r.slug}</Badge>
                    {!r.is_active && <Badge variant="secondary">Inactive</Badge>}
                    {parent && <Badge variant="outline">↳ {parent.name}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Ordre {r.sort_order} · {r.category_type}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(r)}>Modifier</Button>
                  <Button size="sm" variant={r.is_active ? "secondary" : "default"} onClick={() => toggleActive(r)}>
                    {r.is_active ? "Désactiver" : "Réactiver"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-2 mt-4">
            <Button size="sm" variant="outline" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Précédent</Button>
            <span className="text-xs text-muted-foreground">Page {safePage} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Suivant</Button>
          </div>
        )}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugifyCategoryName(e.target.value) })} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div>
              <Label>Icône (emoji ou nom)</Label>
              <Input value={form.icon ?? ""} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </div>
            <div>
              <Label>Catégorie parent</Label>
              <select
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-sm"
                value={form.parent_id ?? ""}
                onChange={(e) => setForm({ ...form, parent_id: e.target.value || null })}
              >
                <option value="">— Aucune —</option>
                {parentOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Ordre d'affichage</Label>
              <Input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={submit}>{editing ? "Enregistrer" : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCategories;
