import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, Check, Camera, ChevronLeft, ChevronRight, Lightbulb, Star, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import StarRating from "@/components/StarRating";
import type { Tables } from "@/integrations/supabase/types";

type PreviewMode = "page" | "search";

const MerchantPhotos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [business, setBusiness] = useState<Tables<"businesses"> | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [previewMode, setPreviewMode] = useState<PreviewMode>("page");
  const [previewIndex, setPreviewIndex] = useState(0);
  const [loading, setLoading] = useState(true);

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
        setPhotos(data?.photos || []);
        setLoading(false);
      });
  }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !business) return;
    const file = e.target.files[0];
    const ext = file.name.split(".").pop();
    const path = `business-photos/${business.id}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("photos").upload(path, file);
    if (uploadErr) {
      toast({ title: "Erreur d'envoi", description: uploadErr.message, variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
    const newPhotos = [...photos, urlData.publicUrl];

    const { error } = await supabase.from("businesses").update({ photos: newPhotos }).eq("id", business.id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setPhotos(newPhotos);
      toast({ title: "Photo ajoutée!" });
    }
  };

  const handleDelete = async () => {
    if (!business || selected.size === 0) return;
    const newPhotos = photos.filter((_, i) => !selected.has(i));
    const { error } = await supabase.from("businesses").update({ photos: newPhotos }).eq("id", business.id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setPhotos(newPhotos);
      setSelected(new Set());
      toast({ title: "Photos supprimées" });
    }
  };

  const toggleSelect = (i: number) => {
    const next = new Set(selected);
    next.has(i) ? next.delete(i) : next.add(i);
    setSelected(next);
  };

  const prevPreview = () => setPreviewIndex(i => Math.max(0, i - 1));
  const nextPreview = () => setPreviewIndex(i => Math.min(photos.length - 1, i + 1));

  if (loading) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto">
        <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
          <h1 className="font-heading text-lg font-bold text-foreground">Photos & Vidéos</h1>
        </div>
        <div className="text-center py-16 text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10 max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground flex-1">Photos & Vidéos</h1>
        {selected.size > 0 && (
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Supprimer ({selected.size})
          </Button>
        )}
      </div>

      {/* Upload button */}
      <div className="px-4 pt-4">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={() => fileRef.current?.click()}>
          <Plus size={16} /> Ajouter des photos
        </Button>
      </div>

      {/* Photo grid */}
      <div className="px-4 pt-4">
        {photos.length === 0 ? (
          <div className="text-center py-12">
            <Camera size={48} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-foreground">Aucune photo</p>
            <p className="text-sm text-muted-foreground mt-1">Ajoutez des photos pour attirer plus de clients.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {photos.map((url, i) => (
              <button
                key={i}
                onClick={() => toggleSelect(i)}
                className="relative aspect-square rounded-xl overflow-hidden group"
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
                <div className={`absolute inset-0 transition-colors ${selected.has(i) ? "bg-primary/30" : "group-hover:bg-black/10"}`} />
                <div className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selected.has(i) ? "bg-primary border-primary" : "border-white/80 bg-black/20"
                }`}>
                  {selected.has(i) && <Check size={14} className="text-primary-foreground" />}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Separator */}
      {photos.length > 0 && (
        <>
          <div className="border-t border-border mx-4 mt-6 mb-4" />

          {/* Preview section */}
          <div className="px-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-lg font-bold text-foreground">Aperçu</h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setPreviewMode("page")}
                  className={`text-sm px-3 py-1 rounded-full transition-colors ${
                    previewMode === "page" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  Sur votre page
                </button>
                <button
                  onClick={() => setPreviewMode("search")}
                  className={`text-sm px-3 py-1 rounded-full transition-colors ${
                    previewMode === "search" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  En recherche
                </button>
              </div>
            </div>

            {previewMode === "page" ? (
              /* Page preview - shows business card style */
              <div className="bg-muted rounded-2xl p-4 relative">
                <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
                  {/* Photo carousel */}
                  <div className="relative aspect-[4/3]">
                    <img
                      src={photos[previewIndex] || "/placeholder.svg"}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <p className="text-white font-bold text-lg">{business?.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <StarRating rating={Number(business?.avg_rating || 0)} size={14} />
                        <span className="text-white/80 text-xs ml-1">Voir tous</span>
                      </div>
                    </div>
                    {photos.length > 1 && (
                      <>
                        <button onClick={prevPreview} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                          <ChevronLeft size={16} />
                        </button>
                        <button onClick={nextPreview} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                          <ChevronRight size={16} />
                        </button>
                      </>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-muted-foreground">
                      {"$".repeat(business?.price_level || 2)} · {business?.description || "Restaurant"}
                    </p>
                  </div>
                </div>

                {/* Mini photos row */}
                <div className="mt-3">
                  <p className="text-sm font-bold text-foreground mb-2">Photos & Vidéos</p>
                  <div className="flex gap-2 overflow-x-auto">
                    {photos.slice(0, 4).map((url, i) => (
                      <img key={i} src={url} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Search preview */
              <div className="bg-muted rounded-2xl p-6">
                <div className="bg-card rounded-xl p-3 flex items-center gap-3 shadow-sm">
                  <img
                    src={photos[0] || "/placeholder.svg"}
                    alt=""
                    className="w-20 h-20 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-foreground text-sm">{business?.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {business?.description || "Restaurant"}, {business?.address}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info banner */}
          <div className="mx-4 mt-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 flex gap-3">
            <Lightbulb size={24} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              QMAPS organisera automatiquement vos photos pour que les plus attrayantes apparaissent en premier.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default MerchantPhotos;
