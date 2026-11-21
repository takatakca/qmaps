import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { isValidPhotoUrl } from "@/lib/businessPhotos";

export default function ListingMedia({ businessId }: { businessId: string }) {
  const [limit, setLimit] = useState(12);
  const photos = useQuery({
    queryKey: ["listing-media", businessId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_photos")
        .select("id,url,caption,media_type")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .order("id")
        .limit(limit + 1);
      if (error) throw error;
      return data;
    },
  });
  if (photos.isError)
    return (
      <Button variant="link" onClick={() => photos.refetch()}>
        Recharger les médias des visiteurs
      </Button>
    );
  if (!photos.data?.length) return null;
  return (
    <section className="p-4 space-y-3">
      <h2 className="font-heading text-lg font-semibold">
        Photos et vidéos des visiteurs
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {photos.data
          .slice(0, limit)
          .filter((m) => isValidPhotoUrl(m.url))
          .map((m) => (
            <figure key={m.id}>
              {m.media_type === "video" ? (
                <video
                  controls
                  preload="metadata"
                  src={m.url}
                  aria-label={m.caption || "Vidéo du commerce"}
                />
              ) : (
                <img
                  loading="lazy"
                  src={m.url}
                  alt={m.caption || "Photo partagée par un visiteur"}
                  className="rounded-lg"
                />
              )}
              {m.caption && (
                <figcaption className="text-sm">{m.caption}</figcaption>
              )}
            </figure>
          ))}
      </div>
      {photos.data.length > limit && (
        <Button variant="outline" onClick={() => setLimit(limit + 12)}>
          Voir plus de médias
        </Button>
      )}
    </section>
  );
}
