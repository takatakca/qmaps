import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MenuItem {
  name: string;
  price?: string;
  description?: string;
  image?: string;
}

interface MenuCategory {
  title: string;
  items: MenuItem[];
}

const sampleMenu: MenuCategory[] = [
  {
    title: "Populaires",
    items: [
      { name: "Poutine classique", price: "12.99$", description: "Frites, fromage en grains, sauce brune maison" },
      { name: "Smoked meat sandwich", price: "16.99$", description: "Viande fumée tranchée à la main sur pain de seigle" },
      { name: "Bagel au saumon fumé", price: "14.50$", description: "Bagel Montréal, fromage à la crème, câpres" },
    ],
  },
  {
    title: "Boissons",
    items: [
      { name: "Café filtre", price: "3.50$" },
      { name: "Latté d'érable", price: "5.75$" },
      { name: "Thé glacé maison", price: "4.25$" },
    ],
  },
];

const BusinessMenuTab = () => {
  return (
    <div className="space-y-5">
      {/* Menu header */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-bold text-foreground">Menu</h3>
        <ArrowRight size={20} className="text-muted-foreground" />
      </div>

      <Button className="w-full rounded-full font-semibold">Voir le menu complet</Button>

      {sampleMenu.map((cat) => (
        <div key={cat.title}>
          <h4 className="font-heading font-semibold text-foreground mb-3">{cat.title}</h4>
          <div className="space-y-3">
            {cat.items.map((item) => (
              <div key={item.name} className="flex items-start justify-between p-3 bg-card rounded-xl border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                  )}
                </div>
                {item.price && (
                  <span className="text-sm font-semibold text-foreground ml-3 shrink-0">{item.price}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BusinessMenuTab;
