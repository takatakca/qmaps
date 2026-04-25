import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import BusinessCard from "@/components/BusinessCard";
import Seo from "@/components/Seo";
import { Skeleton } from "@/components/ui/skeleton";
import { mapBusinessToCard } from "@/lib/business";
import { cityFromSlug } from "@/lib/seo";
import type { Tables } from "@/integrations/supabase/types";

const CityPage = () => {
  const { citySlug = "" } = useParams();
  const cityLabel = cityFromSlug(citySlug);
  const [businesses, setBusinesses] = useState<Tables<"businesses">[]>([]);
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const [{ data: biz }, { data: cats }] = await Promise.all([
        supabase
          .from("businesses")
          .select("*")
          .ilike("city", cityLabel)
          .eq("is_active", true)
          .order("avg_rating", { ascending: false })
          .limit(20),
        supabase.from("categories").select("*").limit(12),
      ]);
      if (cancelled) return;
      setBusinesses(biz || []);
      setCategories(cats || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
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
      />

      <header className="px-4 pt-6 pb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ville</p>
        <h1 className="font-heading text-3xl font-bold mt-1">{cityLabel}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Les meilleurs commerces et pros à {cityLabel}.
        </p>
      </header>

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
        ) : businesses.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm font-medium">Aucun commerce trouvé à {cityLabel}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Soyez le premier à <Link to="/add-business" className="text-primary underline">ajouter une entreprise</Link>.
            </p>
          </div>
        ) : (
          businesses.map((b) => (
            <BusinessCard
              key={b.id}
              business={mapBusinessToCard({ ...b, category_name: "Local" })}
            />
          ))
        )}
      </section>

      <BottomNav />
    </div>
  );
};

export default CityPage;
