import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const ClearHistory = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground">Effacer l'historique</h1>
      </div>

      <div className="px-4 py-4">
        <h2 className="text-sm font-bold text-foreground mb-2">Effacer l'historique</h2>
        <div className="border-t border-border pt-3">
          <p className="text-sm text-muted-foreground">
            Vous pouvez effacer l'historique de recherche par mots-clés et par lieu sur cet appareil.{" "}
            <button className="text-primary font-medium">En savoir plus.</button>
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ClearHistory;
