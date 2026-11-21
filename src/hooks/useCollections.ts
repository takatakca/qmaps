import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const DEFAULT_COLLECTION_NAME = "Want to go";
const collectionFields = "id,name,is_public,collection_items(count),preview:collection_items(businesses(image_url,name))";

function listCollections() {
  return supabase.from("collections").select(collectionFields)
    .neq("name", DEFAULT_COLLECTION_NAME)
    .order("created_at", { ascending: false }).order("id")
    .order("created_at", { referencedTable: "preview", ascending: false })
    .limit(1, { referencedTable: "preview" });
}

export const useCollections = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const cache = useQueryClient();
  const summary = useQuery({
    queryKey: ["collections-index", userId ?? null],
    queryFn: async () => {
      const publicRequest = listCollections().eq("is_public", true).limit(8);
      if (userId) publicRequest.neq("user_id", userId);
      const publicResult = await publicRequest.throwOnError();
      const own = [];
      let bookmarkCount = 0;
      let bookmarkPreview: string | null = null;
      if (userId) {
        const bookmarks = await supabase.from("bookmarks").select("businesses(image_url)", { count: "exact" })
          .eq("user_id", userId).eq("list_name", "saved").order("created_at", { ascending: false }).limit(1).throwOnError();
        bookmarkCount = bookmarks.count ?? 0;
        bookmarkPreview = bookmarks.data?.[0]?.businesses?.image_url ?? null;
        const pageSize = 100;
        for (let offset = 0; ; offset += pageSize) {
          const { data } = await listCollections().eq("user_id", userId).range(offset, offset + pageSize - 1).throwOnError();
          own.push(...data);
          if (data.length < pageSize) break;
        }
      }
      const withPreview = (row: (typeof publicResult.data)[number]) => ({
        id: row.id, name: row.name, is_public: row.is_public,
        items_count: row.collection_items[0]?.count ?? 0,
        preview_image: row.preview[0]?.businesses?.image_url ?? null,
      });
      return { bookmarkCount, bookmarkPreview, own: own.map(withPreview), other: publicResult.data.map(withPreview) };
    },
  });

  useEffect(() => {
    const refresh = () => { void cache.invalidateQueries({ queryKey: ["collections-index", userId ?? null] }); };
    window.addEventListener("qmaps:collections-updated", refresh);
    return () => window.removeEventListener("qmaps:collections-updated", refresh);
  }, [cache, userId]);

  const createCollection = async (name: string, isPublic: boolean) => {
    if (!userId) throw new Error("Connexion requise");
    await supabase.from("collections").insert({ user_id: userId, name: name.trim(), is_public: isPublic }).throwOnError();
    await cache.invalidateQueries({ queryKey: ["my-collection-names", userId] });
    window.dispatchEvent(new CustomEvent("qmaps:collections-updated"));
  };

  return {
    loading: summary.isPending, failed: summary.isError, retry: summary.refetch,
    bookmarkCount: summary.data?.bookmarkCount ?? 0, bookmarkPreview: summary.data?.bookmarkPreview,
    customCollections: summary.data?.own ?? [], publicCollections: summary.data?.other ?? [], createCollection,
  };
};
