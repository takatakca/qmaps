import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useConversationThread } from "@/hooks/useConversations";
import { formatRelativeTime, initialsFromName } from "@/lib/social";

const Conversation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { messages, participants, loading, sendMessage } = useConversationThread(id);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const title = useMemo(() => participants.filter((participant) => participant.id !== user?.id).map((participant) => participant.display_name || "Utilisateur").join(", ") || "Conversation", [participants, user?.id]);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSending(true);
    await sendMessage(trimmed);
    setDraft("");
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
        <div>
          <h1 className="font-heading text-lg font-bold text-foreground">{title}</h1>
          <p className="text-xs text-muted-foreground">Messagerie QMaps</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-10">Chargement...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">Aucun message pour l'instant.</p>
        ) : (
          messages.map((message) => {
            const mine = message.sender_id === user?.id;
            const sender = participants.find((participant) => participant.id === message.sender_id);
            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  {!mine && (
                    <div className="flex items-center gap-2 px-1">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                        {initialsFromName(sender?.display_name)}
                      </div>
                      <span className="text-xs text-muted-foreground">{sender?.display_name || "Utilisateur"}</span>
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"}`}>
                    {message.body}
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1">{formatRelativeTime(message.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-20 max-w-lg mx-auto bg-background border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Écrire un message" onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSend();
            }
          }} />
          <Button onClick={() => void handleSend()} size="icon" className="rounded-full" disabled={sending || !draft.trim()}>
            <Send size={16} />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Conversation;
