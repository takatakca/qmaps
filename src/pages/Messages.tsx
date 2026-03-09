import { useNavigate } from "react-router-dom";
import { ArrowLeft, PenSquare, MessageCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const Messages = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
          <h1 className="font-heading text-lg font-bold text-foreground">Messages</h1>
        </div>
        <button className="p-2"><PenSquare size={22} className="text-foreground" /></button>
      </div>

      <div className="flex flex-col items-center justify-center py-32">
        <MessageCircle size={48} className="text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Aucun message pour l'instant!</p>
      </div>

      <BottomNav />
    </div>
  );
};

export default Messages;
