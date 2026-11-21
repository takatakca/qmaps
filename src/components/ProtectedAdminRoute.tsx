import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  children: React.ReactNode;
}

const ProtectedAdminRoute = ({ children }: Props) => {
  const { user, loading, rolesLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (loading || rolesLoading) return;
    if (!user) {
      navigate(pathname === "/console" ? "/auth?next=console" : "/auth", { replace: true });
      return;
    }
    if (!isAdmin) {
      navigate("/");
    }
  }, [user, loading, rolesLoading, isAdmin, navigate, pathname]);

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Vérification de l'accès...</p>
      </div>
    );
  }

  if (!user || !isAdmin) return null;
  return <>{children}</>;
};

export default ProtectedAdminRoute;
