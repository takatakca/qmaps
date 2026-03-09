import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: React.ReactNode;
}

const ProtectedMerchantRoute = ({ children }: Props) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/merchant/login");
      return;
    }

    const checkRole = async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const hasMerchant = roles?.some(r => r.role === "merchant" || r.role === "admin");

      if (!hasMerchant) {
        // Also check if they own a business
        const { data: biz } = await supabase
          .from("businesses")
          .select("id")
          .eq("owner_user_id", user.id)
          .limit(1);

        if (biz && biz.length > 0) {
          await supabase.from("user_roles").upsert({ user_id: user.id, role: "merchant" as any });
          setAuthorized(true);
        } else {
          navigate("/merchant/login");
          return;
        }
      } else {
        setAuthorized(true);
      }
      setChecking(false);
    };

    checkRole();
  }, [user, authLoading]);

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
