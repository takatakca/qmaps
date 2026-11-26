import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ownedApi, type QmapsPlace } from "@/lib/ownedApi";
import { currentDirectoryAccount, directoryAccountKey, useDirectoryAccount } from "@/hooks/useDirectoryAccount";

export default function DirectoryBookmark({ id, className }: { id: string; className: string }) {
  const cache = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const lock = useRef(false);
  const account = useDirectoryAccount();
  const key = ["qmaps-public-bookmarks", account.data] as const;
  const saved = useQuery({
    queryKey: key,
    queryFn: () => ownedApi<QmapsPlace[]>("me/bookmarks?account=" + account.data),
    enabled: !!account.data,
    retry: false,
    staleTime: 15000,
  });
  const selected = saved.data?.some(place => place.id === id) ?? false;
  const write = useMutation({
    mutationFn: async () => {
      const current = await currentDirectoryAccount();
      if (current !== account.data || !current) {
        cache.setQueryData(directoryAccountKey, current);
        if (!current) navigate("/compte?fiche=" + id);
        return;
      }
      await ownedApi("places/" + id + "/bookmark", selected ? "DELETE" : "PUT");
      await Promise.all([
        cache.invalidateQueries({ queryKey: key }),
        cache.invalidateQueries({ queryKey: ["qmaps-owned-places", current, "saved"] }),
      ]);
    },
    onError: () => toast({ title: "Impossible de modifier vos favoris. Réessayez.", variant: "destructive" }),
    onSettled: () => { lock.current = false; },
  });
  const failed = account.isError || saved.isError;
  return <button type="button" className={className}
    aria-label={failed ? "Recharger les favoris" : selected ? "Retirer des favoris" : "Enregistrer"}
    aria-pressed={selected}
    disabled={account.isPending || (!!account.data && saved.isPending) || write.isPending}
    onClick={event => {
      event.stopPropagation();
      if (account.isError) { void account.refetch(); return; }
      if (!account.data) { navigate("/compte?fiche=" + id); return; }
      if (saved.isError) { void saved.refetch(); return; }
      if (!lock.current) { lock.current = true; write.mutate(); }
    }}>
    <Bookmark size={16} className={selected ? "text-primary fill-primary" : "text-foreground"} />
  </button>;
}
