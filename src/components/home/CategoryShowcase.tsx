import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { categoryImages } from "@/lib/categoryImages";

interface Tile {
  label: string;
  sub: string;
  q: string;
  image: string;
  wide?: boolean;
}

const TILES: Tile[] = [
  { label: "Restaurants", sub: "Tables, bistros et poutineries", q: "restaurants", image: categoryImages.restaurant, wide: true },
  { label: "Cafés", sub: "Torréfacteurs et pâtisseries", q: "cafés", image: categoryImages.cafe },
  { label: "Nettoyage", sub: "Résidentiel et commercial", q: "nettoyage", image: categoryImages.cleaning },
  { label: "Électriciens", sub: "Certifiés, urgences 24/7", q: "électriciens", image: categoryImages.electricien },
  { label: "Plomberie", sub: "Réparation et installation", q: "plomberie", image: categoryImages.plomberie },
  { label: "Construction", sub: "Rénovation et entrepreneurs", q: "construction", image: categoryImages.construction, wide: true },
  { label: "Automobile", sub: "Garages et carrosserie", q: "automobile", image: categoryImages.auto },
  { label: "Beauté", sub: "Coiffure, esthétique, spa", q: "beauté", image: categoryImages.beaute },
  { label: "Santé", sub: "Cliniques et professionnels", q: "santé", image: categoryImages.sante },
  { label: "Épicerie", sub: "Marchés et dépanneurs", q: "épicerie", image: categoryImages.epicerie },
  { label: "Services pros", sub: "Avocats, comptables, notaires", q: "services professionnels", image: categoryImages.pro },
  { label: "Marketing & web", sub: "Studios, photo, design", q: "marketing", image: categoryImages.marketing },
];

const CategoryShowcase = () => (
  <section className="space-y-6">
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-normal text-primary">Explorer</p>
        <h2 className="qmaps-editorial-title mt-2 max-w-xl font-heading font-bold text-foreground">
          Le Québec, à découvrir.
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Les catégories les plus recherchées par les Québécois.
        </p>
      </div>
      <Link
        to="/services"
        className="hidden shrink-0 items-center gap-1 rounded-md border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:text-primary sm:inline-flex"
      >
        Voir tous les services <ArrowUpRight size={13} />
      </Link>
    </div>

    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {TILES.map((tile, index) => (
        <Link
          key={tile.q}
          to={`/search?q=${encodeURIComponent(tile.q)}`}
          className={`group relative isolate overflow-hidden rounded-lg border border-border/70 transition-all duration-300 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
            tile.wide ? "qmaps-category-feature col-span-2" : "qmaps-category-tile"
          }`}
        >
          <img
            src={tile.image}
            alt=""
            aria-hidden
            loading="lazy"
            width={768}
            height={512}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
          <div className="absolute inset-0 qmaps-tile-overlay" />
          <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
            <h3 className="font-heading text-[20px] font-bold leading-tight qmaps-scene-text md:text-[26px]">{tile.label}</h3>
            <p className="qmaps-scene-muted mt-1 text-[12px] leading-relaxed">{tile.sub}</p>
          </div>
          <span className="qmaps-scene-muted absolute left-4 top-5 text-[11px] font-medium md:left-6">{String(index + 1).padStart(2, "0")}</span>
          <span className="qmaps-scene-control absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300 motion-safe:group-hover:rotate-45">
            <ArrowUpRight size={14} />
          </span>
        </Link>
      ))}
    </div>

    <Link
      to="/services"
      className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:text-primary sm:hidden"
    >
      Voir tous les services <ArrowUpRight size={13} />
    </Link>
  </section>
);

export default CategoryShowcase;
