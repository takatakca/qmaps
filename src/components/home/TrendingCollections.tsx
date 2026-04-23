import { Bookmark } from "lucide-react";

const items = [
  { title: "Brunchs du Plateau", count: 14, note: "Favoris du week-end" },
  { title: "Cafés pour coworking", count: 9, note: "Wi-Fi et ambiance calme" },
  { title: "Pros maison fiables", count: 11, note: "Nettoyage, électriciens, plomberie" },
];

const TrendingCollections = () => (
  <section className="space-y-3">
    <div>
      <h2 className="font-heading text-lg font-bold text-foreground">Collections populaires</h2>
      <p className="text-xs text-muted-foreground">Inspirations QMaps pour vos prochaines sorties</p>
    </div>
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.title} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
              <Bookmark size={12} /> {item.count}
            </span>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default TrendingCollections;