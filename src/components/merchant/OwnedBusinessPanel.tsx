import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  chooseMerchantBusiness,
  getSavedMerchantBusinessId,
  saveMerchantBusinessId,
} from "@/lib/merchantSelection";
import { Button } from "@/components/ui/button";
import MerchantPageHeader from "./layout/MerchantPageHeader";

export default function OwnedBusinessPanel({
  title,
  children,
}: {
  title: string;
  children: (businessId: string, userId: string) => React.ReactNode;
}) {
  const { user } = useAuth();
  const userId = user?.id;
  const [selection, setSelection] = useState("");
  const owned = useQuery({
    queryKey: ["content-businesses", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,is_active")
        .eq("owner_user_id", userId)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
  const business = chooseMerchantBusiness(
    owned.data ?? [],
    selection || (userId && getSavedMerchantBusinessId(userId)),
  );
  return (
    <main className="min-h-screen bg-background max-w-lg mx-auto pb-16">
      <MerchantPageHeader title={title} back="/merchant/more" />
      <section className="p-5 space-y-4">
        {owned.isError ? (
          <p role="alert">
            Impossible de charger vos commerces.{" "}
            <Button onClick={() => owned.refetch()}>Réessayer</Button>
          </p>
        ) : owned.isPending ? (
          <p>Chargement…</p>
        ) : !business ? (
          <Link className="text-primary underline" to="/merchant/onboarding">
            Ajouter un commerce
          </Link>
        ) : (
          <>
            <label className="block">
              Commerce
              <select
                className="block w-full rounded-md border bg-background p-2"
                value={business.id}
                onChange={(e) => {
                  setSelection(e.target.value);
                  saveMerchantBusinessId(userId, e.target.value);
                }}
              >
                {owned.data.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            {!business.is_active && (
              <p className="text-sm">Cette fiche est en brouillon.</p>
            )}
            <div key={userId + business.id}>
              {children(business.id, userId)}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
