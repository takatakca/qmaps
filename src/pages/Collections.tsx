import BottomNav from "@/components/BottomNav";
import { Plus } from "lucide-react";
import foodImg from "@/assets/food-1.jpg";
import restaurantImg from "@/assets/restaurant-1.jpg";

const Collections = () => {
  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-heading text-2xl font-bold text-foreground">Collections</h1>
          <button className="text-primary font-semibold text-sm">CRÉER</button>
        </div>

        {/* Featured */}
        <p className="text-sm text-muted-foreground mb-3">En vedette à <span className="font-semibold text-foreground">Montréal</span></p>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {[
            { title: "Top restos de la semaine", img: foodImg, count: 10 },
            { title: "Meilleurs cafés", img: restaurantImg, count: 8 },
          ].map((col) => (
            <div key={col.title} className="min-w-[200px] rounded-xl overflow-hidden bg-card border border-border shadow-sm">
              <div className="relative h-32">
                <img src={col.img} alt={col.title} className="w-full h-full object-cover" />
                <span className="absolute bottom-2 right-2 bg-card/90 backdrop-blur-sm text-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                  🔖 {col.count}
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-foreground">{col.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Par QMaps</p>
              </div>
            </div>
          ))}
        </div>

        {/* My Collections */}
        <h2 className="font-heading font-semibold text-foreground mt-6 mb-3">Mes collections</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm">
            <div className="relative h-28">
              <img src={restaurantImg} alt="À visiter" className="w-full h-full object-cover" />
              <span className="absolute bottom-2 right-2 bg-card/90 backdrop-blur-sm text-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                🔖 1
              </span>
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-foreground">À visiter</p>
              <p className="text-xs text-muted-foreground">Privée</p>
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-border flex items-center justify-center h-[168px] cursor-pointer hover:border-primary/30 transition-colors">
            <div className="flex flex-col items-center gap-1.5">
              <Plus size={24} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Créer</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Collections;
