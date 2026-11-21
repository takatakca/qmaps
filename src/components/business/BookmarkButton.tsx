import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { trackBusinessEvent } from "@/lib/analytics";
import { trackRecommendationEvent } from "@/hooks/useRecommendationEvents";

export default function BookmarkButton({
  businessId,
  source,
  className,
}: {
  businessId: string;
  source: string;
  className: string;
}) {
  const { user, loading } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const cache = useQueryClient();
  const { toast } = useToast();
  const lock = useRef(false);
  const key = ["saved-businesses", userId];
  const saved = useQuery({
    queryKey: key,
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const ids: string[] = [];
      for (let offset = 0; ; offset += 250) {
        const { data, error } = await supabase
          .from("bookmarks")
          .select("business_id")
          .eq("user_id", userId)
          .eq("list_name", "saved")
          .order("business_id")
          .range(offset, offset + 249);
        if (error) throw error;
        ids.push(...data.map((row) => row.business_id));
        if (data.length < 250) return ids;
      }
    },
  });
  const selected = !!userId && (saved.data?.includes(businessId) ?? false);
  const write = useMutation({
    mutationFn: async () => {
      const entry = {
        user_id: userId,
        business_id: businessId,
        list_name: "saved",
      };
      const table = supabase.from("bookmarks");
      const { error } = selected
        ? await table.delete().match(entry)
        : await table.upsert(entry, {
            onConflict: "user_id,business_id,list_name",
            ignoreDuplicates: true,
          });
      if (error) throw error;
      await cache.cancelQueries({ queryKey: key });
      cache.setQueryData<string[]>(key, (old = []) =>
        selected
          ? old.filter((id) => id !== businessId)
          : [...new Set([...old, businessId])],
      );
      void cache.invalidateQueries({
        queryKey: ["collection-contents", "saved", userId],
      });
      window.dispatchEvent(new CustomEvent("qmaps:collections-updated"));
      if (!selected) trackBusinessEvent(businessId, "save_click", { source });
      trackRecommendationEvent({
        business_id: businessId,
        event_type: selected ? "bookmark_remove" : "bookmark_add",
        source,
      });
    },
    onError: () =>
      toast({
        title: "Impossible de modifier vos favoris. Réessayez.",
        variant: "destructive",
      }),
    onSettled: () => {
      lock.current = false;
    },
  });
  return (
    <button
      type="button"
      aria-label={
        saved.isError
          ? "Recharger les favoris"
          : selected
            ? "Retirer des favoris"
            : "Enregistrer"
      }
      aria-pressed={selected}
      disabled={loading || (!!userId && saved.isPending) || write.isPending}
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        if (!userId) {
          navigate("/auth");
          return;
        }
        if (saved.isError) {
          void saved.refetch();
          return;
        }
        if (lock.current) return;
        lock.current = true;
        write.mutate();
      }}
    >
      <Bookmark
        size={16}
        className={selected ? "text-primary fill-primary" : "text-foreground"}
      />
    </button>
  );
}
