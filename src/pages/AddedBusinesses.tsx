import { useNavigate } from "react-router-dom";
import { ArrowLeft, Store } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const AddedBusinesses = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-primary text-primary-foreground flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} /></button>
        <h1 className="font-heading text-lg font-bold">Commerces ajoutés</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-32 px-8">
        <Store size={48} className="text-muted-foreground mb-4" />
        <h2 className="text-lg font-bold text-foreground mb-2">Aucun commerce ajouté</h2>
        <p className="text-sm text-muted-foreground text-center">
          Les commerces que vous avez ajoutés et qui ont été vérifiés apparaîtront ici. La vérification prend généralement quelques jours.
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default AddedBusinesses;
