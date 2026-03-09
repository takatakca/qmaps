import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const Compliments = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-primary text-primary-foreground flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} /></button>
        <h1 className="font-heading text-lg font-bold">Compliments</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-32">
        <Heart size={48} className="text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Aucun compliment reçu</p>
        <p className="text-xs text-muted-foreground mt-1">Les compliments que vous recevrez apparaîtront ici.</p>
      </div>

      <BottomNav />
    </div>
  );
};

export default Compliments;
