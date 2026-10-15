import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: React.ReactNode;
}

const ProtectedMerchantRoute = ({ children }: Props) => {
  const { user, loading: authLoading, isMerchant, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authorizedOwnerId, setAuthorizedOwnerId] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setChecking(true);
    setAccessError(null);
    setAuthorizedOwnerId(null);

    if (!user) {
      navigate("/auth?role=merchant", { replace: true });
      setChecking(false);
      return;
    }

    const id = user.id;
    const check = async () => {
      if (isMerchant) {
        if (!cancelled) {
          setAuthorizedOwnerId(id);
          setChecking(false);
        }
        return;
      }
      try {
        // A missing merchant role may only be repaired for an owned listing.
        const { data: owned, error: ownerError } = await supabase
          .from("businesses").select("id").eq("owner_user_id", id).limit(1);
        if (ownerError) throw ownerError;
        if (!owned?.length) {
          if (!cancelled) navigate("/merchant/onboarding", { replace: true });
          return;
        }
        const { error: roleError } = await supabase.from("user_roles").upsert(
          { user_id: id, role: "merchant" },
          { onConflict: "user_id,role", ignoreDuplicates: true },
        );
        if (roleError) throw roleError;
        await refreshRoles();
        if (!cancelled) setAuthorizedOwnerId(id);
      } catch (error) {
        if (!cancelled) {
          setAccessError(error instanceof Error ? error.message : "Vérification impossible");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    void check();
    return () => { cancelled = true; };
  }, [user?.id, authLoading, isMerchant, retryVersion, navigate]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Vérification de l'accès...</p>
      </div>
    );
  }

  if (accessError) {
    return (
      <div role="alert" className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-destructive text-sm">Accès commerçant non confirmé : {accessError}</p>
        <button type="button" className="rounded-md border border-input px-4 py-2" onClick={() => setRetryVersion((v) => v + 1)}>Réessayer</button>
      </div>
    );
  }

  if (!user || authorizedOwnerId !== user.id) return null;
  return <>{children}</>;
};

export default ProtectedMerchantRoute;
