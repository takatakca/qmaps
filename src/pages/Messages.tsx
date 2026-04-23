import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, PenSquare, MessageCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useConversations } from "@/hooks/useConversations";
import { formatRelativeTime, initialsFromName } from "@/lib/social";

const Messages = () => {
  const navigate = useNavigate();
  const { conversations, loading } = useConversations();

  useEffect(() => {
    const handleRefresh = () => window.dispatchEvent(new Event("focus"));
    window.addEventListener("qmaps:messages-updated", handleRefresh);
    return () => window.removeEventListener("qmaps:messages-updated", handleRefresh);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
          <h1 className="font-heading text-lg font-bold text-foreground">Messages</h1>
        </div>
        <button className="p-2" onClick={() => navigate("/messages/new")}><PenSquare size={22} className="text-foreground" /></button>
      </div>

      {loading ? (
        <p className="py-20 text-center text-sm text-muted-foreground">Chargement...</p>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32">
          <MessageCircle size={48} className="text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucun message pour l'instant!</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {conversations.map((conversation) => {
            const title = conversation.participants.map((participant) => participant.display_name || "Utilisateur").join(", ") || "Conversation";
            return (
              <button
                key={conversation.id}
                onClick={() => navigate(`/messages/${conversation.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
                  {initialsFromName(title)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground truncate">{title}</p>
                    {conversation.last_message_at && (
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{formatRelativeTime(conversation.last_message_at)}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{conversation.last_message || "Démarrer la conversation"}</p>
                </div>
                {conversation.unread_count > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center shrink-0">
                    {conversation.unread_count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Messages;
