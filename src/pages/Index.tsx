import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import SearchBar from "@/components/SearchBar";
import CategoryRow from "@/components/CategoryRow";
import BusinessCard from "@/components/BusinessCard";
import BottomNav from "@/components/BottomNav";
import type { Tables } from "@/integrations/supabase/types";

const priceLabels = ["$", "$$", "$$$", "$$$$"];

const Index = () => {
  const [businesses, setBusinesses] = useState<Tables<"businesses">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinesses = async () => {
      const { data } = await supabase
        .from("businesses")
        .select("*")
        .order("avg_rating", { ascending: false });
      setBusinesses(data || []);
      setLoading(false);
    };
    fetchBusinesses();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">
            Q<span className="text-primary">Maps</span>
          </h1>
          <span className="text-xs text-muted-foreground font-medium bg-secondary px-2 py-1 rounded-full">
            📍 Montréal
          </span>
        </div>
        <SearchBar />
      </div>

      {/* Categories */}
      <div className="px-4 mt-3">
        <CategoryRow />
      </div>

      {/* Feed */}
      <div className="px-4 mt-4 space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Chargement...</p>
        ) : (
          businesses.map((b) => (
            <BusinessCard
              key={b.id}
              business={{
                id: b.id,
                name: b.name,
                category: "",
                rating: Number(b.avg_rating),
                reviewCount: b.reviews_count,
                priceLevel: priceLabels[(b.price_level || 1) - 1],
                neighborhood: b.city,
                image: b.image_url || "/placeholder.svg",
                isOpen: b.is_open,
                address: b.address,
                phone: b.phone || "",
                hours: b.hours || "",
                description: b.description || "",
                amenities: b.amenities || [],
                photos: b.photos || [],
              }}
            />
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
