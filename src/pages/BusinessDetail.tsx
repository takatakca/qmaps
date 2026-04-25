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
import { trackBusinessEvent } from "@/lib/analytics";
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

  const handleBookmark = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!id) return;
    if (bookmarked) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("business_id", id);
      setBookmarked(false);
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, business_id: id });
      setBookmarked(true);
      trackBusinessEvent(id, "save_click", { source: "business_detail" });
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

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
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

      {/* Actions */}
      <BusinessActions
        businessId={business.id}
        priceLevel={business.price_level}
        categoryName=""
        isOpen={business.is_open}
        hours={business.hours}
        website={business.website}
        phone={business.phone}
        onWriteReview={() => { if (!user) navigate("/auth"); else setActiveTab("Avis"); }}
      />

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-background border-b border-border mt-2">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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
        {activeTab === "Menu" && <BusinessMenuTab />}
        {activeTab === "Demander" && (
          <BusinessAskTab businessName={business.name} isClaimed={business.is_claimed} />
        )}
        {activeTab === "Info" && (
          <BusinessInfoTab
            hours={business.hours}
            isOpen={business.is_open}
            website={business.website}
            phone={business.phone}
            address={business.address}
            city={business.city}
            region={business.region}
            postalCode={business.postal_code}
            amenities={business.amenities}
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

      {/* Vibe section */}
      <BusinessVibeSection photos={business.photos || []} amenities={business.amenities} />

      {/* Nearby */}
      <BusinessNearbySection currentBusinessId={business.id} city={business.city} isClaimed={business.is_claimed} />

      <BottomNav />
    </div>
  );
};

export default BusinessDetail;
