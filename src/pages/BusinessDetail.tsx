import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import BusinessHero from "@/components/business/BusinessHero";
import BusinessActions from "@/components/business/BusinessActions";
import BusinessMenuTab from "@/components/business/BusinessMenuTab";
import BusinessAskTab from "@/components/business/BusinessAskTab";
import BusinessInfoTab from "@/components/business/BusinessInfoTab";
import BusinessReviewsTab from "@/components/business/BusinessReviewsTab";
import BusinessVibeSection from "@/components/business/BusinessVibeSection";
import BusinessNearbySection from "@/components/business/BusinessNearbySection";
import BusinessTrustBadges from "@/components/business/BusinessTrustBadges";
import ClaimBusinessModal from "@/components/business/ClaimBusinessModal";
import SimilarBusinessesSection from "@/components/recommendations/SimilarBusinessesSection";
import ReportButton from "@/components/reports/ReportButton";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { trackBusinessEvent } from "@/lib/analytics";
import { trackRecommendationEvent } from "@/hooks/useRecommendationEvents";
import Seo from "@/components/Seo";
import { slugify } from "@/lib/seo";
import { isBusinessOpenNow } from "@/lib/searchFilters";
import { readBusinessStatus } from "@/lib/businessStatus";
import type { Tables } from "@/integrations/supabase/types";

const tabs = ["Menu", "Demander", "Info", "Avis"] as const;
type Tab = typeof tabs[number];

const BusinessDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [business, setBusiness] = useState<Tables<"businesses"> | null>(null);
  const [reviews, setReviews] = useState<(Tables<"reviews"> & { profiles?: { display_name: string | null } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Menu");
  const [userName, setUserName] = useState<string | null>(null);
  const [claimOpen, setClaimOpen] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    const [{ data: biz }, { data: revs }] = await Promise.all([
      supabase.from("businesses").select("*").eq("id", id).maybeSingle(),
      supabase.from("reviews").select("*, profiles:user_id(display_name)").eq("business_id", id).order("created_at", { ascending: false }),
    ]);
    setBusiness(biz);
    setReviews((revs as any) || []);

    if (user) {
      const [{ data: bk }, { data: profile }] = await Promise.all([
        supabase.from("bookmarks").select("id").eq("user_id", user.id).eq("business_id", id).maybeSingle(),
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
      ]);
      setBookmarked(!!bk);
      setUserName(profile?.display_name || null);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id, user]);

  // Track profile view once per business id
  useEffect(() => {
    if (id) trackBusinessEvent(id, "profile_view", { source: "business_detail" });
  }, [id]);

  // Phase 9D — recommendation signal: business_view
  useEffect(() => {
    if (business?.id) {
      trackRecommendationEvent({
        business_id: business.id,
        event_type: "business_view",
        source: "business_detail",
        city: business.city ?? null,
      });
    }
  }, [business?.id, business?.city]);

  const handleBookmark = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!id) return;
    if (bookmarked) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("business_id", id);
      setBookmarked(false);
      trackRecommendationEvent({
        business_id: id,
        event_type: "bookmark_remove",
        source: "business_detail",
        city: business?.city ?? null,
      });
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, business_id: id });
      setBookmarked(true);
      trackBusinessEvent(id, "save_click", { source: "business_detail" });
      trackRecommendationEvent({
        business_id: id,
        event_type: "bookmark_add",
        source: "business_detail",
        city: business?.city ?? null,
      });
    }
  };

  if (loading || !business) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto">
        {/* Skeleton */}
        <div className="w-full h-72 bg-muted animate-pulse" />
        <div className="px-4 pt-4 space-y-3">
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-muted rounded-full animate-pulse mt-4" />
        </div>
        <BottomNav />
      </div>
    );
  }

  const seoTitle = `${business.name}${business.city ? ` · ${business.city}` : ""} | QMaps`;
  const seoDescription = (business.description?.trim()
    ? business.description
    : `${business.name}${business.city ? ` à ${business.city}` : ""}. ${business.reviews_count} avis · note ${Number(business.avg_rating).toFixed(1)}/5 sur QMaps.`).slice(0, 200);
  const localBusinessJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    image: business.image_url || undefined,
    telephone: business.phone || undefined,
    url: business.website || `${typeof window !== "undefined" ? window.location.origin : ""}/business/${business.id}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address,
      addressLocality: business.city,
      addressRegion: business.region,
      postalCode: business.postal_code,
      addressCountry: business.country,
    },
    geo: business.latitude && business.longitude ? {
      "@type": "GeoCoordinates",
      latitude: business.latitude,
      longitude: business.longitude,
    } : undefined,
    aggregateRating: business.reviews_count > 0 ? {
      "@type": "AggregateRating",
      ratingValue: Number(business.avg_rating),
      reviewCount: business.reviews_count,
    } : undefined,
  };

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <Seo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={`/business/${business.id}`}
        image={business.image_url || undefined}
        type="profile"
        jsonLdId="local-business"
        jsonLd={localBusinessJsonLd}
      />
      {/* Hero */}
      <BusinessHero
        name={business.name}
        imageUrl={business.image_url || "/placeholder.svg"}
        avgRating={Number(business.avg_rating)}
        reviewsCount={business.reviews_count}
        isClaimed={business.is_claimed}
        photosCount={(business.photos || []).length}
        bookmarked={bookmarked}
        onBookmark={handleBookmark}
      />
      {/* hidden link kept for SSR-friendly category link */}
      {business.city && (
        <link rel="alternate" data-city-slug={slugify(business.city)} />
      )}

      {/* Actions */}
      <BusinessActions
        businessId={business.id}
        priceLevel={business.price_level}
        categoryName=""
        isOpen={isBusinessOpenNow(business as any)}
        hours={business.hours}
        website={business.website}
        phone={business.phone}
        onWriteReview={() => { if (!user) navigate("/auth"); else setActiveTab("Avis"); }}
        onViewHours={() => {
          setActiveTab("Info");
          setTimeout(() => {
            document.getElementById("business-hours")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 50);
        }}
      />

      <BusinessTrustBadges business={business as any} />

      {!business.is_claimed && (!user || business.owner_user_id !== user.id) && (
        <div className="mx-4 mt-3 p-3 rounded-xl border border-border bg-secondary/40 flex items-center justify-between gap-2">
          <div className="text-xs">
            <p className="font-semibold text-foreground">Vous êtes le propriétaire?</p>
            <p className="text-muted-foreground">Revendiquez ce commerce pour le gérer.</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1 shrink-0" onClick={() => setClaimOpen(true)}>
            <ShieldCheck size={14} /> Revendiquer
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-background border-b border-border mt-2">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === "Menu" && business?.id) {
                  trackBusinessEvent(business.id, "menu_view", { source: "business_detail" });
                }
              }}
              className={`flex-1 py-3 text-sm font-semibold text-center transition-colors relative ${
                activeTab === tab ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 pt-4">
        {activeTab === "Menu" && <BusinessMenuTab businessId={business.id} />}
        {activeTab === "Demander" && (
          <BusinessAskTab businessName={business.name} isClaimed={business.is_claimed} />
        )}
        {activeTab === "Info" && (
          <BusinessInfoTab
            hours={business.hours}
            hoursJson={(business as any).hours_json}
            specialHours={(business as any).special_hours}
            isOpen={isBusinessOpenNow(business as any)}
            status={readBusinessStatus(business as any)}
            website={business.website}
            phone={business.phone}
            address={business.address}
            city={business.city}
            region={business.region}
            postalCode={business.postal_code}
            amenities={business.amenities}
            paymentMethods={(business as any).payment_methods}
            languages={(business as any).languages}
            accessibility={(business as any).accessibility}
            latitude={business.latitude}
            longitude={business.longitude}
          />
        )}
        {activeTab === "Avis" && (
          <BusinessReviewsTab
            businessId={business.id}
            reviews={reviews}
            avgRating={Number(business.avg_rating)}
            reviewsCount={business.reviews_count}
            userId={user?.id || null}
            userName={userName}
            onReviewSubmitted={fetchData}
            onNavigateAuth={() => navigate("/auth")}
          />
        )}
      </div>

      {/* Vibe section or photo empty-state */}
      {(business.photos || []).length > 0 ? (
        <BusinessVibeSection photos={business.photos || []} amenities={business.amenities} />
      ) : (
        <div className="px-4 py-6 border-t border-border bg-secondary/30 text-center">
          <p className="text-sm font-medium text-foreground">Aucune photo pour le moment</p>
          {user && business.owner_user_id === user.id ? (
            <>
              <p className="text-xs text-muted-foreground mt-1">Mettez en valeur votre commerce avec quelques photos.</p>
              <button
                onClick={() => navigate("/merchant/business-info")}
                className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
              >
                Ajouter des photos
              </button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Vous êtes le propriétaire? Ajoutez des photos depuis votre portail marchand.
            </p>
          )}
        </div>
      )}

      {/* Similar businesses (Phase 9F) */}
      <SimilarBusinessesSection businessId={business.id} />

      {/* Nearby */}
      <BusinessNearbySection currentBusinessId={business.id} city={business.city} isClaimed={business.is_claimed} />

      {/* Report listing */}
      <div className="px-4 mt-4 flex justify-center">
        <ReportButton targetType="business" targetId={business.id} variant="ghost" />
      </div>

      <BottomNav />

      <ClaimBusinessModal
        businessId={business.id}
        businessName={business.name}
        open={claimOpen}
        onOpenChange={setClaimOpen}
      />
    </div>
  );
};

export default BusinessDetail;
