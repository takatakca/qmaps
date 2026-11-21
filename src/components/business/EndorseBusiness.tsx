import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export default function EndorseBusiness({
  businessId,
}: {
  businessId: string;
}) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const key = ["business-endorsement", businessId, user?.id];
  const match = { business_id: businessId, user_id: user?.id };
  const vote = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_endorsements")
        .select("recommended")
        .match(match)
        .maybeSingle();
      if (error) throw error;
      return data?.recommended ?? null;
    },
  });
  const save = useMutation({
    mutationFn: async (value: boolean) => {
      const table = supabase.from("business_endorsements");
      if (vote.data === value) {
        const { error } = await table.delete().match(match);
        if (error) throw error;
        return null;
      }
      if (vote.data == null) {
        const { error } = await table
          .insert({ business_id: businessId, recommended: value })
          .select("recommended")
          .single();
        if (!error) return value;
        if (error.code !== "23505") throw error;
      }
      const { error } = await table
        .update({ recommended: value })
        .match(match)
        .select("recommended")
        .single();
      if (error) throw error;
      return value;
    },
    onSuccess: (value) => cache.setQueryData(key, value),
  });
  return (
    <fieldset className="mt-4 space-y-2">
      <legend className="text-sm font-semibold">
        Recommandez-vous ce commerce?
      </legend>
      <div className="flex gap-2">
        {[true, false].map((value) => (
          <Button
            key={String(value)}
            variant={user && vote.data === value ? "default" : "outline"}
            aria-pressed={!!user && vote.data === value}
            disabled={
              loading ||
              (!!user && (vote.isPending || vote.isError)) ||
              save.isPending
            }
            onClick={() => {
              if (!user) navigate("/auth");
              else save.mutate(value);
            }}
          >
            {value ? "Oui" : "Non"}
          </Button>
        ))}
      </div>
      {vote.isError && (
        <Button variant="link" onClick={() => vote.refetch()}>
          Recharger ma réponse
        </Button>
      )}
      {save.isError && (
        <p role="alert">Impossible d’enregistrer votre réponse.</p>
      )}
    </fieldset>
  );
}
