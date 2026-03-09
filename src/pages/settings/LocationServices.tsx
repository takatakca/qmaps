import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const LocationServices = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground">Services de localisation</h1>
      </div>

      <div className="px-4 py-4">
        <button className="w-full flex items-center justify-between py-3">
          <span className="text-sm font-medium text-foreground">En permanence</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
        <p className="text-sm text-muted-foreground border-t border-border pt-3">
          Vous avez autorisé QMAPS à recevoir la localisation de votre appareil. Appuyez sur la flèche pour ajuster ce paramètre.
        </p>
        <div className="border-t border-border mt-4 pt-4">
          <p className="text-sm text-muted-foreground">
            QMAPS peut utiliser votre localisation lorsque vous utilisez l'application pour rechercher des commerces à proximité, pour les visites en magasin, des notifications plus pertinentes, et plus encore. Vous pouvez ajuster vos paramètres de localisation à tout moment.{" "}
            <button className="text-primary font-medium">En savoir plus.</button>
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default LocationServices;
