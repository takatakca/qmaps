import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackBusinessEvent } from "@/lib/analytics";
import { trackRecommendationEvent } from "@/hooks/useRecommendationEvents";

export default function BookmarkButton({ id, city, source }: { id: string; city: string; source: string }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const client = useQueryClient();
  const lock = useRef(false);
  const [saving, setSaving] = useState(false);
  const key = ["saved-businesses", user?.id];
  const saved = useQuery({
    queryKey: key,
    enabled: !!user,
    staleTime: 60000,
    queryFn: async () => {
      const ids: string[] = [];
      const size = 500;
      for (let start = 0; ; start += size) {
        const { data, error } = await supabase.from("bookmarks").select("business_id")
          .eq("user_id", user!.id).eq("list_name", "saved")
          .order("business_id").range(start, start + size - 1);
        if (error) throw error;
        ids.push(...data.map(row => row.business_id));
        if (data.length < size) return ids;
      }
    },
  });
  const selected = saved.data?.includes(id) ?? false;
  const toggle = async () => {
    if (!user) { navigate("/auth"); return; }
    if (lock.current) return;
    lock.current = true;
    setSaving(true);
    try {
      if (!saved.data) {
        await saved.refetch({ throwOnError: true });
        return;
      }
      const row = { business_id: id, user_id: user.id, list_name: "saved" };
      const { error } = selected
        ? await supabase.from("bookmarks").delete().match(row)
        : await supabase.from("bookmarks").upsert(row, { onConflict: "user_id,business_id,list_name", ignoreDuplicates: true });
      if (error) throw error;
      client.setQueryData<string[]>(key, (ids = []) =>
        selected ? ids.filter(value => value !== id) : [...new Set([...ids, id])]);
      if (!selected) trackBusinessEvent(id, "save_click", { source });
      trackRecommendationEvent({ business_id: id, event_type: selected ? "bookmark_remove" : "bookmark_add", source, city });
    } catch {
      toast({ title: "Impossible de mettre vos favoris à jour.", variant: "destructive" });
    } finally {
      setSaving(false);
      lock.current = false;
    }
  };
  return <button type="button" aria-label={selected ? "Retirer des favoris" : "Enregistrer"}
    aria-pressed={selected} disabled={loading || saving || (!!user && saved.isPending)} onClick={toggle}
    className="flex h-9 w-9 items-center justify-center rounded-full bg-card/95 shadow-soft hover:text-primary">
    <Bookmark size={16} className={selected ? "fill-primary text-primary" : "text-foreground"} />
  </button>;
}
