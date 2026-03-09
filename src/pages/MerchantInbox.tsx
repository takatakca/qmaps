import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings, MessageSquare, Moon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

const MerchantInbox = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [business, setBusiness] = useState<Tables<"businesses"> | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [messagingEnabled, setMessagingEnabled] = useState(true);
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
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="font-heading text-lg font-bold text-foreground flex-1">Boîte de réception</h1>
      </div>

      {/* Business info bar */}
      {business && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0">
            {business.image_url ? (
              <img src={business.image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                {business.name[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">{business.name}</p>
            <p className="text-xs text-muted-foreground truncate">{business.address}, {business.city}</p>
          </div>
          <div className="flex items-center gap-2">
            {!business.is_open && (
              <span className="flex items-center gap-1 text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground">
                <Moon size={12} /> Hors horaires
              </span>
            )}
            <button onClick={() => setShowSettings(true)}>
              <Settings size={20} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="w-32 h-32 rounded-full bg-secondary flex items-center justify-center mb-6">
          <MessageSquare size={48} className="text-primary" />
        </div>
        <h2 className="font-heading text-2xl font-black text-foreground leading-tight">
          Aucun message pour le moment.
        </h2>
        <p className="text-lg text-muted-foreground mt-3 leading-relaxed">
          Lorsque quelqu'un vous envoie un message, il apparaîtra ici.
        </p>
      </div>

      {/* Settings modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold">Paramètres</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={messagingEnabled}
                onCheckedChange={(v) => setMessagingEnabled(!!v)}
                className="mt-1"
              />
              <div>
                <p className="font-semibold text-foreground text-sm">
                  Autoriser les gens à envoyer des messages à votre entreprise
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  En activant la messagerie, vous acceptez de recevoir des courriels de QMAPS lorsque des clients envoient des demandes.
                </p>
              </div>
            </div>
          </div>
          <Button onClick={() => setShowSettings(false)} className="rounded-lg">
            Sauvegarder
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MerchantInbox;
