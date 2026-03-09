import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MerchantBottomNav from "@/components/MerchantBottomNav";
import { ArrowLeft, PenSquare, MessageCircle, Search, Settings, Moon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { Tables } from "@/integrations/supabase/types";

const MerchantMessages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [business, setBusiness] = useState<Tables<"businesses"> | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [messagingEnabled, setMessagingEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
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
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/merchant/home")}><ArrowLeft size={22} className="text-foreground" /></button>
            <h1 className="font-heading text-lg font-bold text-foreground">Boîte de réception</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(!showSearch)} className="p-2">
              <Search size={20} className="text-muted-foreground" />
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2">
              <Settings size={20} className="text-muted-foreground" />
            </button>
            <button className="p-2">
              <PenSquare size={20} className="text-foreground" />
            </button>
          </div>
        </div>

        {showSearch && (
          <div className="px-4 pb-3">
            <Input
              placeholder="Rechercher dans les messages..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="rounded-full bg-muted border-0"
            />
          </div>
        )}

        {/* Business info bar */}
        {business && (
          <div className="flex items-center gap-3 px-4 py-2 border-t border-border">
            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0">
              {business.image_url ? (
                <img src={business.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">{business.name[0]}</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs text-foreground truncate">{business.name}</p>
            </div>
            {!business.is_open && (
              <span className="flex items-center gap-1 text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                <Moon size={10} /> Fermé
              </span>
            )}
          </div>
        )}
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="w-28 h-28 rounded-full bg-secondary flex items-center justify-center mb-5">
          <MessageCircle size={44} className="text-primary" />
        </div>
        <h2 className="font-heading text-xl font-black text-foreground leading-tight">
          Aucun message pour le moment
        </h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xs">
          Lorsqu'un client vous envoie un message ou une demande, il apparaîtra ici.
        </p>
      </div>

      {/* Settings modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold">Paramètres de messagerie</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start gap-3">
              <Checkbox checked={messagingEnabled} onCheckedChange={(v) => setMessagingEnabled(!!v)} className="mt-1" />
              <div>
                <p className="font-semibold text-foreground text-sm">Autoriser les messages</p>
                <p className="text-sm text-muted-foreground mt-1">
                  En activant la messagerie, les clients pourront vous envoyer des demandes directement.
                </p>
              </div>
            </div>
          </div>
          <Button onClick={() => setShowSettings(false)} className="rounded-lg">Sauvegarder</Button>
        </DialogContent>
      </Dialog>

      <MerchantBottomNav />
    </div>
  );
};

export default MerchantMessages;
