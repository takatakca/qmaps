import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Star, Link as LinkIcon, ChevronUp, ChevronDown, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  addPhotoUrl,
  dedupePhotoUrls,
  isValidPhotoUrl,
  movePhotoToFront,
  removePhotoUrl,
  reorderPhotos,
} from "@/lib/businessPhotos";
import type { Tables } from "@/integrations/supabase/types";

const MerchantPhotos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [business, setBusiness] = useState<Tables<"businesses"> | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("businesses")
      .select("*")
      .eq("owner_user_id", user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setBusiness(data);
        setPhotos(dedupePhotoUrls(data?.photos || []));
        setLoading(false);
      });
  }, [user]);

  const persist = async (next: string[]) => {
    if (!business) return false;
    setSaving(true);
    const { error } = await supabase.from("businesses").update({ photos: next }).eq("id", business.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return false;
    }
    setPhotos(next);
    return true;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !business) return;
    const file = e.target.files[0];
    e.target.value = "";
    const ext = file.name.split(".").pop() || "jpg";
    const path = `business-photos/${business.id}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("photos").upload(path, file);
    if (uploadErr) {
      toast({ title: "Erreur d'envoi", description: uploadErr.message, variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
    const result = addPhotoUrl(photos, urlData.publicUrl);
    if (!result.ok) {
      toast({ title: "Photo déjà ajoutée", variant: "destructive" });
      return;
    }
    if (await persist(result.urls)) toast({ title: "Photo ajoutée!" });
  };

  const handleAddByUrl = async () => {
    const result = addPhotoUrl(photos, urlDraft);
    if (result.ok === false) {
      toast({
        title: result.reason === "duplicate" ? "Photo déjà ajoutée" : "URL invalide",
        description: result.reason === "invalid" ? "L'URL doit commencer par http(s)://" : undefined,
        variant: "destructive",
      });
      return;
    }
    if (await persist(result.urls)) {
      setUrlDraft("");
      toast({ title: "Photo ajoutée!" });
    }
  };

  const handleDelete = async (url: string) => {
    if (!confirm("Supprimer cette photo?")) return;
    if (await persist(removePhotoUrl(photos, url))) toast({ title: "Photo supprimée" });
  };

  const handleSetCover = async (url: string) => {
    if (await persist(movePhotoToFront(photos, url))) toast({ title: "Photo de couverture mise à jour" });
  };

  const handleMove = async (i: number, dir: -1 | 1) => {
    await persist(reorderPhotos(photos, i, i + dir));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto">
        <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={22} /></button>
          <h1 className="font-heading text-lg font-bold">Photos & Vidéos</h1>
        </div>
        <div className="text-center py-16 text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)} aria-label="Retour"><ArrowLeft size={22} /></button>
        <h1 className="font-heading text-lg font-bold flex-1">Photos & Vidéos</h1>
      </div>

      <div className="px-4 pt-4 space-y-3">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <Button variant="default" className="w-full gap-2 rounded-xl" onClick={() => fileRef.current?.click()} disabled={saving}>
          <Plus size={16} /> Téléverser une photo
        </Button>

        <div className="flex gap-2">
          <Input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://… (ajouter par URL)"
            className="flex-1"
          />
          <Button variant="outline" onClick={handleAddByUrl} disabled={saving || !isValidPhotoUrl(urlDraft)} className="gap-1">
            <LinkIcon size={14} /> Ajouter
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          La première photo sert de couverture. Réorganisez avec les flèches ou marquez une photo comme couverture.
        </p>
      </div>

      <div className="px-4 pt-4">
        {photos.length === 0 ? (
          <div className="text-center py-12">
            <Camera size={48} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-foreground">Aucune photo</p>
            <p className="text-sm text-muted-foreground mt-1">Ajoutez des photos pour attirer plus de clients.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {photos.map((url, i) => (
              <li key={url} className="flex items-center gap-3 p-2 bg-card rounded-xl border border-border">
                <div className="relative">
                  <img src={url} alt="" className="w-20 h-20 rounded-lg object-cover" onError={(e) => ((e.target as HTMLImageElement).src = "/placeholder.svg")} />
                  {i === 0 && (
                    <span className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5">
                      <Star size={8} className="fill-current" /> Couv.
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{url}</p>
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleMove(i, -1)} disabled={i === 0 || saving} aria-label="Monter">
                      <ChevronUp size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleMove(i, 1)} disabled={i === photos.length - 1 || saving} aria-label="Descendre">
                      <ChevronDown size={14} />
                    </Button>
                    {i !== 0 && (
                      <Button size="sm" variant="outline" className="h-7 px-2 gap-1" onClick={() => handleSetCover(url)} disabled={saving}>
                        <Star size={12} /> Couverture
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => handleDelete(url)} disabled={saving} aria-label="Supprimer">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MerchantPhotos;
