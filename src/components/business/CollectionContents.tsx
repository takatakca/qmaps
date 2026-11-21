import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import BookmarkButton from "./BookmarkButton";
import BottomNav from "@/components/BottomNav";

export default function CollectionContents({
  id,
  userId,
}: {
  id: string;
  userId?: string;
}) {
  const saved = id === "saved";
  const key = ["collection-contents", id, userId];
  const cache = useQueryClient();
  const [limit, setLimit] = useState(25);
  const [target, setTarget] = useState("");
  const meta = useQuery({
    queryKey: ["collection-meta", id, userId],
    enabled: !saved,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("name,user_id")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });
  const lists = useQuery({
    queryKey: ["my-collection-names", userId],
    enabled: saved && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id,name")
        .eq("user_id", userId)
        .neq("name", "Want to go")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
  const items = useQuery({
    queryKey: [...key, limit],
    enabled: !saved || !!userId,
    queryFn: async () => {
      const query = saved
        ? supabase
            .from("bookmarks")
            .select("business_id,businesses(name)")
            .eq("user_id", userId)
            .eq("list_name", "saved")
        : supabase
            .from("collection_items")
            .select("business_id,businesses(name)")
            .eq("collection_id", id);
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .order("business_id")
        .limit(limit + 1);
      if (error) throw error;
      return data;
    },
  });
  const change = useMutation({
    mutationFn: async (businessId: string) => {
      const table = supabase.from("collection_items");
      const result = saved
        ? await table.upsert(
            { collection_id: target, business_id: businessId },
            { onConflict: "collection_id,business_id", ignoreDuplicates: true },
          )
        : await table
            .delete()
            .match({ collection_id: id, business_id: businessId });
      if (result.error) throw result.error;
    },
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: ["collection-contents"] });
      window.dispatchEvent(new CustomEvent("qmaps:collections-updated"));
    },
  });
  return (
    <main className="max-w-lg mx-auto p-4 pb-24 space-y-4">
      <Link to="/collections" className="text-primary underline">
        Toutes les collections
      </Link>
      <h1 className="font-heading text-xl font-bold">
        {saved ? "Mes favoris" : meta.data?.name || "Collection"}
      </h1>
      {saved && !userId ? (
        <Link to="/auth">Me connecter pour voir mes favoris</Link>
      ) : (
        <>
          {saved && !!lists.data?.length && (
            <label>
              Copier des favoris dans
              <select
                className="block w-full rounded border p-2 bg-background"
                value={target}
                onChange={(e) => {
                  setTarget(e.target.value);
                  change.reset();
                }}
              >
                <option value="">Choisir une collection</option>
                {lists.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {meta.isError || items.isError ? (
            <p role="alert">
              Impossible d’ouvrir cette collection.{" "}
              <Button
                variant="link"
                onClick={() => {
                  void items.refetch();
                  if (!saved) void meta.refetch();
                }}
              >
                Réessayer
              </Button>
            </p>
          ) : items.isPending ? (
            <p>Chargement…</p>
          ) : !items.data.length ? (
            <p>Aucun commerce enregistré.</p>
          ) : (
            items.data.slice(0, limit).map((row) => (
              <div
                key={row.business_id}
                className="rounded-xl border p-3 space-y-2"
              >
                {row.businesses ? (
                  <Link
                    className="font-semibold underline"
                    to={`/business/${row.business_id}`}
                  >
                    {row.businesses.name}
                  </Link>
                ) : (
                  <span>Fiche indisponible</span>
                )}
                {saved && (
                  <div>
                    <BookmarkButton
                      source="collections"
                      businessId={row.business_id}
                      className="rounded border p-2"
                    />
                  </div>
                )}
                {(target ||
                  (!saved && userId && meta.data?.user_id === userId)) && (
                  <Button
                    disabled={change.isPending}
                    variant="outline"
                    onClick={() => change.mutate(row.business_id)}
                  >
                    {saved
                      ? "Copier dans la collection"
                      : "Retirer de cette collection"}
                  </Button>
                )}
              </div>
            ))
          )}
          {items.data?.length > limit && (
            <Button variant="outline" onClick={() => setLimit(limit + 25)}>
              Voir plus
            </Button>
          )}
          {change.isError && (
            <p role="alert">Impossible de mettre la collection à jour.</p>
          )}
          {change.isSuccess && <p role="status">Collection mise à jour.</p>}
        </>
      )}
      <BottomNav />
    </main>
  );
}
