import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { topPlaces, type DirectoryPlace } from "@/lib/ownedDirectory";
import BottomNav from "@/components/BottomNav";
import BusinessCard from "@/components/BusinessCard";
import Seo from "@/components/Seo";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryNameFromEmbed, mapBusinessToCard } from "@/lib/business";
import SponsoredListings from "@/components/sponsored/SponsoredListings";
import { cityLabelFor, cityLabelFromSlug } from "@/lib/localSearch";
import SearchBar from "@/components/SearchBar";
import RecommendedSection from "@/components/recommendations/RecommendedSection";
import { useRecommendedBusinesses } from "@/hooks/useRecommendedBusinesses";
import type { Tables } from "@/integrations/supabase/types";

const CityPage = () => {
  const { citySlug = "" } = useParams();
  const cityLabel = cityLabelFromSlug(citySlug);
  const [businesses, setBusinesses] = useState<DirectoryPlace[]>([]);
  const [categories, setCategories] = useState<Pick<Tables<"categories">, "id" | "name" | "slug">[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const { recommended, loading: recLoading } = useRecommendedBusinesses({ city: cityLabel, limit: 4 });

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    setBusinesses([]);
    setCategories([]);
    topPlaces(new URLSearchParams({ city: cityLabel }), 20, controller.signal)
      .then(rows => {
        if (controller.signal.aborted) return;
        setBusinesses(rows);
        const localCategories = new Map(rows.flatMap(row => row.business_categories.map(
          ({ categories: category }) => [category.id, category] as const
        )));
        setCategories([...localCategories.values()].slice(0, 12));
        setLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setError(true);
        setLoading(false);
      });
    return () => controller.abort();
  }, [cityLabel]);

  const title = `Meilleures entreprises à ${cityLabel} | QMaps`;
  const description = `Découvrez restaurants, services, boutiques et pros locaux à ${cityLabel} sur QMaps. Avis, photos et recommandations.`;

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <Seo
        title={title}
        description={description}
        canonicalPath={`/city/${citySlug}`}
        image={businesses[0]?.image_url || undefined}
        jsonLdId="city"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          description,
          about: { "@type": "City", name: cityLabel },
        }}
        noindex={!loading && !error && businesses.length === 0}
      />

      <header className="px-4 pt-6 pb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ville</p>
        <h1 className="font-heading text-3xl font-bold mt-1">{cityLabel}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Les meilleurs commerces et pros à {cityLabel}.
        </p>
        <div className="mt-4"><SearchBar initialCity={cityLabel || ""} /></div>
      </header>

      <SponsoredListings placement="city" city={cityLabel} />

      {categories.length > 0 && (
        <section className="px-4 mb-4">
          <h2 className="font-heading text-sm font-bold mb-2">Catégories populaires</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/city/${citySlug}/${c.slug}`}
                className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="px-4 space-y-3">
        <h2 className="font-heading text-lg font-bold">Mieux notés à {cityLabel}</h2>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        ) : error ? (
          <p role="alert">Impossible de charger les commerces de cette ville.</p>
        ) : businesses.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm font-medium">Aucun commerce trouvé à {cityLabel}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Soyez le premier à <Link to="/add-business" className="text-primary underline">ajouter une entreprise</Link>.
            </p>
          </div>
        ) : (
          businesses.map((b) => (
            <BusinessCard ownedDirectory
              key={b.id}
              business={mapBusinessToCard({ ...b, category_name: categoryNameFromEmbed(b) })}
            />
          ))
        )}
      </section>

      <div className="px-4 mt-6">
        <RecommendedSection
          title={`Recommandé à ${cityLabel}`}
          subtitle="Sélectionné pour vous selon votre activité"
          source="city_recommended"
          items={recommended.filter(r => cityLabelFor(r.business.city || "") === cityLabel).map((r) => ({ business: r.business, reasonCodes: r.reasonCodes }))}
          loading={recLoading}
        />
      </div>

      <BottomNav />
    </div>
  );
};

export default CityPage;
