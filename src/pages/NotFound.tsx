import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Seo from "@/components/Seo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <Seo
        title="Page introuvable · QMAPS"
        description="La page que vous cherchez n'existe pas ou a été déplacée."
        noindex
      />
      <div className="max-w-md text-center space-y-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">QMAPS</p>
        <h1 className="text-5xl font-bold text-foreground">404</h1>
        <p className="text-lg text-muted-foreground">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Link to="/" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground font-medium">
            Retour à l'accueil
          </Link>
          <Link to="/search" className="rounded-lg border px-4 py-2 text-foreground font-medium">
            Rechercher un commerce
          </Link>
          <Link to="/sitemap.xml" className="text-sm text-muted-foreground underline">
            Voir le plan du site
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
