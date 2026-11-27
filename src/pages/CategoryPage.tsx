import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { topPlaces, type DirectoryPlace } from "@/lib/ownedDirectory";
import { useAllCategories } from "@/hooks/useAllCategories";
import BottomNav from "@/components/BottomNav";
import BusinessCard from "@/components/BusinessCard";
import Seo from "@/components/Seo";
import { Skeleton } from "@/components/ui/skeleton";
import { mapBusinessToCard } from "@/lib/business";
import SponsoredListings from "@/components/sponsored/SponsoredListings";
import { cityLabelFromSlug } from "@/lib/localSearch";
import { ownedMerchantUrl } from "@/lib/ownedRoutes";
import SearchBar from "@/components/SearchBar";
import DirectoryRecommendations from "@/components/recommendations/DirectoryRecommendations";
import { useRecommendedBusinesses } from "@/hooks/useRecommendedBusinesses";

const CategoryPage = () => {
  const { categorySlug = "", citySlug } = useParams();
  const cityLabel = citySlug ? cityLabelFromSlug(citySlug) : null;

  const catalogue = useAllCategories();
  const category = catalogue.categories.find(item => item.slug === categorySlug);
  const [businesses, setBusinesses] = useState<DirectoryPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const unavailable = catalogue.error || listError;
  const { recommended, loading: recLoading } = useRecommendedBusinesses({
    city: cityLabel,
    category: categorySlug,
    limit: 4,
  });

  useEffect(() => {
    const controller = new AbortController();
    setBusinesses([]);
    setListError(false);
    if (!category) {
      setLoading(catalogue.loading);
      return;
    }
    setLoading(true);
    const filters = new URLSearchParams({ category: category.slug });
    if (cityLabel) filters.set("city", cityLabel);
    topPlaces(filters, 30, controller.signal)
      .then(rows => { if (!controller.signal.aborted) setBusinesses(rows); })
      .catch(() => { if (!controller.signal.aborted) setListError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [category, catalogue.loading, cityLabel]);

  const heading = category?.name || categorySlug;
  const title = cityLabel
    ? `Meilleurs ${heading} à ${cityLabel} | QMaps`
    : `Meilleurs ${heading} près de chez vous | QMaps`;
  const description = cityLabel
    ? `Trouvez les meilleurs ${heading} à ${cityLabel}. Avis, photos et recommandations locales sur QMaps.`
    : `Trouvez les meilleurs ${heading} avec avis, photos et recommandations locales sur QMaps.`;
  const canonical = cityLabel ? `/city/${citySlug}/${categorySlug}` : `/c/${categorySlug}`;

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <Seo
        title={category ? title : `Catégorie introuvable | QMaps`}
        description={category ? description : `Cette catégorie n'existe pas sur QMaps.`}
        canonicalPath={canonical}
        image={businesses[0]?.image_url || undefined}
        noindex={!loading && !unavailable && (!category || businesses.length === 0)}
        jsonLdId="category"
        jsonLd={category ? {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          description,
        } : undefined}
      />

      <header className="px-4 pt-6 pb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {cityLabel ? (
            <Link to={`/city/${citySlug}`} className="hover:text-foreground">
              {cityLabel} · Catégorie
            </Link>
          ) : "Catégorie"}
        </p>
        <h1 className="font-heading text-3xl font-bold mt-1">{heading}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {cityLabel
            ? `Les meilleurs ${heading} à ${cityLabel}.`
            : `Découvrez les meilleurs ${heading} sur QMaps.`}
        </p>
        {cityLabel && category && (
          <Link to={`/c/${categorySlug}`} className="text-xs text-primary underline mt-2 inline-block">
            Voir tous les {category.name} →
          </Link>
        )}
        <div className="mt-4"><SearchBar initialCity={cityLabel || ""} initialCategory={categorySlug} /></div>
      </header>

      {category && (
        <SponsoredListings
          placement="category"
          city={cityLabel || undefined}
          categoryId={category.id}
        />
      )}

      <section className="px-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        ) : unavailable ? (
          <p role="alert">Impossible de charger cette catégorie pour le moment.</p>
        ) : !category ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm font-medium">Catégorie introuvable</p>
            <Link to="/" className="text-xs text-primary underline mt-2 inline-block">
              Retour à l'accueil
            </Link>
          </div>
        ) : businesses.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm font-medium">
              Aucune entreprise dans {heading}{cityLabel ? ` à ${cityLabel}` : ""}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <Link to={ownedMerchantUrl} className="text-primary underline">
                Ajouter une entreprise
              </Link>
            </p>
          </div>
        ) : (
          businesses.map((b) => (
            <BusinessCard ownedDirectory
              key={b.id}
              business={mapBusinessToCard({ ...b, category_name: category.name })}
            />
          ))
        )}
      </section>

      {category && (
        <div className="px-4 mt-6">
          <DirectoryRecommendations
            title={`Recommandé dans ${category.name}`}
            subtitle="Commerces de l’annuaire QMAPS"

            items={recommended.map((r) => ({ business: r.business, reasonCodes: r.reasonCodes }))}
            loading={recLoading}
          />
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default CategoryPage;
