import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import OwnedBusinessPanel from "@/components/merchant/OwnedBusinessPanel";
import { highlights } from "@/lib/profileHighlights";
import { publicContentUrl } from "@/lib/businessContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ProfileEditor({
  businessId,
  userId,
}: {
  businessId: string;
  userId: string;
}) {
  const key = ["profile-highlights", businessId, userId];
  const cache = useQueryClient();
  const result = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("logo_url,profile_highlights")
        .eq("id", businessId)
        .eq("owner_user_id", userId)
        .single();
      if (error) throw error;
      return data;
    },
  });
  const [draft, setDraft] = useState<{
    logo_url: string;
    profile_highlights: string[];
  } | null>(null);
  const current = draft ?? {
    logo_url: result.data?.logo_url ?? "",
    profile_highlights: result.data?.profile_highlights ?? [],
  };
  const url = publicContentUrl(current.logo_url.trim());
  const write = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("businesses")
        .update({
          logo_url: url,
          profile_highlights: current.profile_highlights,
        })
        .eq("owner_user_id", userId)
        .eq("id", businessId)
        .select("id")
        .single();
      if (error) throw error;
    },
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: key });
      setDraft(null);
    },
  });
  if (result.isPending) return <p>Chargement…</p>;
  if (result.isError)
    return (
      <Button onClick={() => result.refetch()}>
        Recharger les informations
      </Button>
    );
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (draft && !write.isPending) write.mutate();
      }}
    >
      <label>
        Adresse HTTPS du logo
        <Input
          type="url"
          maxLength={2048}
          value={current.logo_url}
          onChange={(e) => setDraft({ ...current, logo_url: e.target.value })}
        />
      </label>
      <fieldset disabled={write.isPending} className="space-y-2">
        <legend>Points forts de votre commerce (jusqu’à six)</legend>
        {Object.entries(highlights).map(([id, label]) => (
          <label key={id} className="flex gap-2">
            <input
              type="checkbox"
              checked={current.profile_highlights.includes(id)}
              disabled={
                !current.profile_highlights.includes(id) &&
                current.profile_highlights.length >= 6
              }
              onChange={(e) =>
                setDraft({
                  ...current,
                  profile_highlights: e.target.checked
                    ? [...current.profile_highlights, id]
                    : current.profile_highlights.filter((x) => x !== id),
                })
              }
            />
            {label}
          </label>
        ))}
      </fieldset>
      {write.isError && (
        <p role="alert">
          Enregistrement impossible. Votre saisie est conservée.
        </p>
      )}
      {write.isSuccess && !draft && <p role="status">Profil enregistré.</p>}
      <Button
        disabled={
          !draft || write.isPending || (!!current.logo_url.trim() && !url)
        }
      >
        Enregistrer
      </Button>
      <Link
        className="block underline text-primary"
        to={`/business/${businessId}`}
      >
        Voir ma fiche
      </Link>
    </form>
  );
}
export default function MerchantHighlights() {
  return (
    <OwnedBusinessPanel title="Logo et points forts">
      {(businessId, userId) => (
        <ProfileEditor businessId={businessId} userId={userId} />
      )}
    </OwnedBusinessPanel>
  );
}
