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
  <section className="space-y-4">
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Explorer</p>
        <h2 className="mt-1 font-heading text-[20px] font-bold tracking-tight text-foreground md:text-[26px]">
          Par service, partout au Québec
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Les catégories les plus recherchées par les Québécois.
        </p>
      </div>
      <Link
        to="/services"
        className="hidden shrink-0 items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:text-primary sm:inline-flex"
      >
        Voir tous les services <ArrowUpRight size={13} />
      </Link>
    </div>

    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {TILES.map((tile) => (
        <Link
          key={tile.q}
          to={`/search?q=${encodeURIComponent(tile.q)}`}
          className={`group relative isolate overflow-hidden rounded-2xl border border-border/70 shadow-premium transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-premium-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
            tile.wide ? "col-span-2 h-40 md:h-48" : "h-40 md:h-48"
          }`}
        >
          <img
            src={tile.image}
            alt=""
            aria-hidden
            loading="lazy"
            width={768}
            height={512}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(5,10,20,0.95)] via-[rgba(5,10,20,0.45)] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3.5">
            <h3 className="font-heading text-[15px] font-bold leading-tight text-white">{tile.label}</h3>
            <p className="mt-0.5 line-clamp-1 text-[11px] text-white/70">{tile.sub}</p>
          </div>
          <span className="absolute right-3 top-3 inline-flex h-7 w-7 translate-y-1 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight size={14} />
          </span>
        </Link>
      ))}
    </div>

    <Link
      to="/services"
      className="inline-flex w-full items-center justify-center gap-1 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:text-primary sm:hidden"
    >
      Voir tous les services <ArrowUpRight size={13} />
    </Link>
  </section>
);

export default CategoryShowcase;
