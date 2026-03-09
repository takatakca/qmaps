import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setDisplayName(data?.display_name || ""));
  }, [user]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id);
    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profil mis à jour" });
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground">À propos de vous</h1>
      </div>

      <div className="bg-muted py-8 flex flex-col items-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-card border-2 border-border flex items-center justify-center">
            <User size={40} className="text-muted-foreground" />
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Camera size={14} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Ajouter une photo</p>
      </div>

      <div className="px-4 py-6 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Nom d'affichage</label>
          <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
        </div>
        <Button onClick={save} disabled={loading} className="w-full rounded-full">
          {loading ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

      <div className="px-4 py-4 border-t border-border">
        <p className="text-sm text-muted-foreground text-center">Rien d'autre à ajouter</p>
      </div>
    </div>
  );
};

export default EditProfile;
