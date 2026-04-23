import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { CollectionRecord, CollectionWithPreview } from "@/lib/social";

export const DEFAULT_COLLECTION_NAME = "Want to go";

type BookmarkRow = {
  business_id: string;
  created_at: string;
  businesses: {
    image_url: string | null;
    name: string;
  } | null;
};

type CollectionItemRow = {
  collection_id: string;
  businesses: {
    image_url: string | null;
    name: string;
  } | null;
};

export const useCollections = () => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<CollectionWithPreview[]>([]);
  const [publicCollections, setPublicCollections] = useState<CollectionWithPreview[]>([]);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [bookmarkPreview, setBookmarkPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCollections = useCallback(async () => {
    if (!user) {
      setCollections([]);
      setPublicCollections([]);
      setBookmarkCount(0);
      setBookmarkPreview(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const [bookmarkResult, collectionsResult, publicResult] = await Promise.all([
      supabase
        .from("bookmarks")
        .select("*, businesses(image_url, name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("collections" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("collections" as any)
        .select("*")
        .eq("is_public", true)
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const bookmarkRows = (bookmarkResult.data || []) as BookmarkRow[];
    setBookmarkCount(bookmarkRows.length);
    setBookmarkPreview(bookmarkRows[0]?.businesses?.image_url || null);

    const enrich = async (rows: CollectionRecord[]) => {
      if (!rows.length) return [] as CollectionWithPreview[];

      const ids = rows.map((row) => row.id);
      const { data: items } = await supabase
        .from("collection_items" as any)
        .select("collection_id, businesses(image_url, name)")
        .in("collection_id", ids);

      const grouped = new Map<string, CollectionItemRow[]>();
      for (const item of (items || []) as CollectionItemRow[]) {
        const list = grouped.get(item.collection_id) || [];
        list.push(item);
        grouped.set(item.collection_id, list);
      }

      return rows.map((row) => {
        const related = grouped.get(row.id) || [];
        return {
          ...row,
          items_count: related.length,
          preview_image: related[0]?.businesses?.image_url || null,
          preview_business_name: related[0]?.businesses?.name || null,
        } satisfies CollectionWithPreview;
      });
    };

    const ownCollections = await enrich(((collectionsResult.data || []) as unknown) as CollectionRecord[]);
    const othersCollections = await enrich(((publicResult.data || []) as unknown) as CollectionRecord[]);

    const hasDefault = ownCollections.some((collection) => collection.name === DEFAULT_COLLECTION_NAME);
    if (!hasDefault) {
      const { data: inserted } = await supabase
        .from("collections" as any)
        .insert({ user_id: user.id, name: DEFAULT_COLLECTION_NAME, is_public: false })
        .select("*")
        .single();

      if (inserted) {
        ownCollections.unshift({
          ...((inserted as unknown) as CollectionRecord),
          items_count: 0,
          preview_image: null,
          preview_business_name: null,
        });
      }
    }

    setCollections(ownCollections.sort((a, b) => Number(b.name === DEFAULT_COLLECTION_NAME) - Number(a.name === DEFAULT_COLLECTION_NAME)));
    setPublicCollections(othersCollections);
    setLoading(false);
  }, [user]);

  const createCollection = useCallback(async (name: string, isPublic: boolean) => {
    if (!user) throw new Error("not-authenticated");
    const trimmed = name.trim();
    if (!trimmed) throw new Error("empty-name");

    const { error } = await supabase
      .from("collections" as any)
      .insert({ user_id: user.id, name: trimmed, is_public: isPublic });

    if (error) throw error;
    await loadCollections();
    window.dispatchEvent(new CustomEvent("qmaps:collections-updated"));
  }, [loadCollections, user]);

  useEffect(() => {
    void loadCollections();
  }, [loadCollections]);

  const defaultCollection = useMemo(
    () => collections.find((collection) => collection.name === DEFAULT_COLLECTION_NAME) || null,
    [collections],
  );

  const customCollections = useMemo(
    () => collections.filter((collection) => collection.name !== DEFAULT_COLLECTION_NAME),
    [collections],
  );

  return {
    loading,
    bookmarkCount,
    bookmarkPreview,
    defaultCollection,
    customCollections,
    publicCollections,
    createCollection,
    refresh: loadCollections,
  };
};
