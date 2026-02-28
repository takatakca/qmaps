import BottomNav from "@/components/BottomNav";
import BusinessCard from "@/components/BusinessCard";
import { businesses, categories } from "@/data/mockData";
import { Button } from "@/components/ui/button";

const Projects = () => {
  const serviceCategories = categories.filter(c => 
    ["Déménageurs", "Plombiers", "Nettoyage", "Électriciens", "Réparation auto"].includes(c.name)
  );

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Projets</h1>
        <p className="text-muted-foreground text-sm mt-1">Engagez un professionnel local</p>

        {/* Service Categories */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide mt-4 pb-2">
          {serviceCategories.map((cat) => (
            <div key={cat.id} className="flex flex-col items-center gap-1.5 min-w-[72px]">
              <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center text-2xl shadow-sm">
                {cat.icon}
              </div>
              <span className="text-xs text-foreground font-medium text-center">{cat.name}</span>
            </div>
          ))}
        </div>

        {/* Service List */}
        <div className="mt-6 space-y-4">
          <h2 className="font-heading font-semibold text-foreground">Quoi de neuf?</h2>
          {businesses.filter(b => b.category !== "Restaurants" && b.category !== "Cafés").map((b) => (
            <div key={b.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{categories.find(c => c.name === b.category)?.icon}</span>
                <div>
                  <h3 className="font-heading font-semibold text-foreground text-sm">{b.name}</h3>
                  <p className="text-xs text-muted-foreground">{b.category}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="rounded-full text-xs h-8">Commencer</Button>
                <Button size="sm" variant="outline" className="rounded-full text-xs h-8">Ajouter au plan</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Projects;
