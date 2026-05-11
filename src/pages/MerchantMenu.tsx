import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, EyeOff, Eye, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  formatPriceCents,
  groupMenuItemsByCategory,
  type MenuItem,
} from "@/lib/menuItems";
import type { Tables } from "@/integrations/supabase/types";

interface Draft {
  id?: string;
  name: string;
  description: string;
  category: string;
  price_dollars: string;
  photo_url: string;
  is_available: boolean;
  sort_order: number;
}

const emptyDraft = (): Draft => ({
  name: "",
  description: "",
  category: "",
  price_dollars: "",
  photo_url: "",
  is_available: true,
  sort_order: 0,
});

const MerchantMenu = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [business, setBusiness] = useState<Tables<"businesses"> | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const menuFileRef = useRef<HTMLInputElement>(null);

  const handleMenuImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !business || !editing) return;
    const file = e.target.files[0];
    e.target.value = "";
    const ext = file.name.split(".").pop() || "jpg";
    const path = `businesses/${business.id}/menu/${Date.now()}.${ext}`;
    setUploadingImage(true);
    const { error: uploadErr } = await supabase.storage.from("photos").upload(path, file);
    if (uploadErr) {
      setUploadingImage(false);
      toast({ title: "Erreur d'envoi", description: uploadErr.message, variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
    setEditing({ ...editing, photo_url: urlData.publicUrl });
    setUploadingImage(false);
  };

  const fetchAll = async () => {
    if (!user) return;
    const { data: biz } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_user_id", user.id)
      .limit(1)
      .maybeSingle();
    setBusiness(biz);
    if (biz) {
      const { data } = await (supabase as any)
        .from("business_menu_items")
        .select("*")
        .eq("business_id", biz.id)
        .order("category", { ascending: true })
        .order("sort_order", { ascending: true });
      setItems((data as MenuItem[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const startNew = () => setEditing(emptyDraft());
  const startEdit = (item: MenuItem) =>
    setEditing({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      category: item.category ?? "",
      price_dollars: item.price_cents != null ? (item.price_cents / 100).toFixed(2) : "",
      photo_url: item.photo_url ?? "",
      is_available: item.is_available !== false,
      sort_order: item.sort_order ?? 0,
    });

  const handleSave = async () => {
    if (!business || !editing) return;
    if (!editing.name.trim()) {
      toast({ title: "Nom requis", variant: "destructive" });
      return;
    }
    if (editing.photo_url && !/^https?:\/\//i.test(editing.photo_url)) {
      toast({ title: "URL de photo invalide", description: "L'URL doit commencer par http(s)://", variant: "destructive" });
      return;
    }
    const priceNum = editing.price_dollars.trim() === "" ? null : Number(editing.price_dollars);
    if (priceNum != null && (!Number.isFinite(priceNum) || priceNum < 0)) {
      toast({ title: "Prix invalide", variant: "destructive" });
      return;
    }
    const payload = {
      business_id: business.id,
      name: editing.name.trim(),
      description: editing.description.trim() || null,
      category: editing.category.trim() || null,
      price_cents: priceNum != null ? Math.round(priceNum * 100) : null,
      photo_url: editing.photo_url.trim() || null,
      is_available: editing.is_available,
      sort_order: editing.sort_order ?? 0,
    };
    setSaving(true);
    const res = editing.id
      ? await (supabase as any).from("business_menu_items").update(payload).eq("id", editing.id)
      : await (supabase as any).from("business_menu_items").insert(payload);
    setSaving(false);
    if (res.error) {
      toast({ title: "Erreur", description: res.error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing.id ? "Article mis à jour" : "Article ajouté" });
    setEditing(null);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet article du menu?")) return;
    const { error } = await (supabase as any).from("business_menu_items").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Article supprimé" });
    fetchAll();
  };

  const toggleAvailability = async (item: MenuItem) => {
    const { error } = await (supabase as any)
      .from("business_menu_items")
      .update({ is_available: !item.is_available })
      .eq("id", item.id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    fetchAll();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div>;
  }
  if (!business) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Aucune entreprise trouvée.</p></div>;
  }

  const grouped = groupMenuItemsByCategory(items);

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-12">
      <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/merchant")} aria-label="Retour"><ArrowLeft size={22} /></button>
        <h1 className="font-heading text-base font-bold flex-1">Menu</h1>
        <Button size="sm" onClick={startNew} className="gap-1"><Plus size={14} /> Ajouter</Button>
      </div>

      <div className="px-4 pt-4 space-y-6">
        {grouped.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground mb-3">Aucun article au menu.</p>
            <Button onClick={startNew} variant="outline" className="rounded-full gap-2">
              <Plus size={14} /> Ajouter un premier article
            </Button>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.category}>
              <h2 className="font-heading font-semibold text-foreground mb-2">{group.category}</h2>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-card rounded-xl border border-border">
                    {item.photo_url && (
                      <img src={item.photo_url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold ${item.is_available ? "text-foreground" : "text-muted-foreground line-through"}`}>
                          {item.name}
                        </p>
                        {item.price_cents != null && (
                          <span className="text-sm font-semibold text-foreground ml-auto">
                            {formatPriceCents(item.price_cents, item.currency)}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => toggleAvailability(item)}
                          className="text-xs text-muted-foreground inline-flex items-center gap-1"
                        >
                          {item.is_available ? <><Eye size={12} /> Visible</> : <><EyeOff size={12} /> Masqué</>}
                        </button>
                        <button
                          onClick={() => startEdit(item)}
                          className="text-xs text-primary inline-flex items-center gap-1"
                        >
                          <Pencil size={12} /> Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-xs text-destructive inline-flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Modifier l'article" : "Nouvel article"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Nom *</label>
                <Input
                  value={editing.name}
                  maxLength={120}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Description</label>
                <Textarea
                  value={editing.description}
                  rows={3}
                  maxLength={500}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Catégorie</label>
                  <Input
                    value={editing.category}
                    maxLength={60}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    placeholder="Plats, Boissons…"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Prix (CAD)</label>
                  <Input
                    value={editing.price_dollars}
                    inputMode="decimal"
                    onChange={(e) => setEditing({ ...editing, price_dollars: e.target.value })}
                    placeholder="12.99"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Photo de l'article</label>
                {editing.photo_url && (
                  <div className="relative w-24 h-24 mb-2">
                    <img src={editing.photo_url} alt="" className="w-full h-full object-cover rounded-lg" onError={(e) => ((e.target as HTMLImageElement).src = "/placeholder.svg")} />
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, photo_url: "" })}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"
                      aria-label="Retirer la photo"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <input
                  ref={menuFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleMenuImageUpload}
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => menuFileRef.current?.click()} disabled={uploadingImage}>
                    {uploadingImage ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Téléverser
                  </Button>
                </div>
                <Input
                  value={editing.photo_url}
                  onChange={(e) => setEditing({ ...editing, photo_url: e.target.value })}
                  placeholder="ou collez une URL https://…"
                  className="mt-2"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Disponible</span>
                <Switch
                  checked={editing.is_available}
                  onCheckedChange={(v) => setEditing({ ...editing, is_available: v })}
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Annuler</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                  Sauvegarder
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MerchantMenu;
