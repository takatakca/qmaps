import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import { useConversations } from "@/hooks/useConversations";
import { initialsFromName } from "@/lib/social";

const NewMessage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createConversation } = useConversations();
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<{ id: string; display_name: string | null }[]>([]);
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("id, display_name")
      .neq("id", user.id)
      .order("display_name", { ascending: true })
      .limit(25)
      .then(({ data }) => setProfiles((data || []) as any));
  }, [user]);

  const filtered = profiles.filter((profile) => {
    const haystack = `${profile.display_name || ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const handleStartConversation = async (targetId: string) => {
    setStartingId(targetId);
    try {
      const conversationId = await createConversation(targetId);
      navigate(`/messages/${conversationId}`);
    } finally {
      setStartingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground">Nouveau message</h1>
      </div>

      <div className="px-4 py-4 border-b border-border">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un utilisateur" className="pl-9" />
        </div>
      </div>

      <div className="divide-y divide-border">
        {filtered.map((profile) => (
          <button key={profile.id} disabled={startingId === profile.id} onClick={() => void handleStartConversation(profile.id)} className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-accent/30 transition-colors disabled:opacity-60">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
              {initialsFromName(profile.display_name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{profile.display_name || "Utilisateur"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile.email || "Disponible sur QMaps"}</p>
            </div>
          </button>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default NewMessage;
