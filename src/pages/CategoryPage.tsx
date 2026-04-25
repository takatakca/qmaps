import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import BusinessCard from "@/components/BusinessCard";
import Seo from "@/components/Seo";
import { Skeleton } from "@/components/ui/skeleton";
import { mapBusinessToCard } from "@/lib/business";
import SponsoredListings from "@/components/sponsored/SponsoredListings";
import { cityFromSlug } from "@/lib/seo";
import RecommendedSection from "@/components/recommendations/RecommendedSection";
import { useRecommendedBusinesses } from "@/hooks/useRecommendedBusinesses";
import type { Tables } from "@/integrations/supabase/types";

const CategoryPage = () => {
  const { categorySlug = "", citySlug } = useParams();
  const cityLabel = citySlug ? cityFromSlug(citySlug) : null;

  const [category, setCategory] = useState<Tables<"categories"> | null>(null);
  const [businesses, setBusinesses] = useState<Tables<"businesses">[]>([]);
  const [loading, setLoading] = useState(true);
  const { recommended, loading: recLoading } = useRecommendedBusinesses({
    city: cityLabel,
    limit: 4,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const { data: cat } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", categorySlug)
        .maybeSingle();
      if (cancelled) return;
      setCategory(cat);

      if (!cat) {
        setBusinesses([]);
        setLoading(false);
        return;
      }

      const { data: links } = await supabase
        .from("business_categories")
        .select("business_id")
        .eq("category_id", cat.id)
        .limit(50);
      const ids = (links || []).map((l) => l.business_id);

      if (ids.length === 0) {
        setBusinesses([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from("businesses")
        .select("*")
        .in("id", ids)
        .eq("is_active", true)
        .order("avg_rating", { ascending: false })
        .limit(30);
      if (cityLabel) query = query.ilike("city", cityLabel);
      const { data: biz } = await query;
      if (cancelled) return;
      setBusinesses(biz || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [categorySlug, cityLabel]);

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
        noindex={!loading && !category}
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
              <Link to="/add-business" className="text-primary underline">
                Ajouter une entreprise
              </Link>
            </p>
          </div>
        ) : (
          businesses.map((b) => (
            <BusinessCard
              key={b.id}
              business={mapBusinessToCard({ ...b, category_name: category.name })}
            />
          ))
        )}
      </section>

      <BottomNav />
    </div>
  );
};

export default CategoryPage;
