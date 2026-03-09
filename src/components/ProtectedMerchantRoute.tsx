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
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/auth?role=merchant");
      return;
    }

    const check = async () => {
      if (isMerchant) {
        setAuthorized(true);
        setChecking(false);
        return;
      }

      // Fallback: check if they own a business
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_user_id", user.id)
        .limit(1);

      if (biz && biz.length > 0) {
        await supabase.from("user_roles").upsert({ user_id: user.id, role: "merchant" as any });
        await refreshRoles();
        setAuthorized(true);
      } else {
        navigate("/auth?role=merchant");
      }
      setChecking(false);
    };

    check();
  }, [user, authLoading, isMerchant]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Vérification de l'accès...</p>
      </div>
    );
  }

  if (!authorized) return null;
  return <>{children}</>;
};

export default ProtectedMerchantRoute;
