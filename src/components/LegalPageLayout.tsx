import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Seo from "@/components/Seo";
import BottomNav from "@/components/BottomNav";

interface LegalPageLayoutProps {
  title: string;
  description: string;
  canonicalPath: string;
  lastUpdated: string;
  children: ReactNode;
}

const LegalPageLayout = ({
  title,
  description,
  canonicalPath,
  lastUpdated,
  children,
}: LegalPageLayoutProps) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background pb-24 max-w-2xl mx-auto">
      <Seo
        title={`${title} · QMAPS`}
        description={description}
        canonicalPath={canonicalPath}
        type="article"
      />
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3 pt-safe">
        <button onClick={() => navigate(-1)} aria-label="Retour">
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="font-heading text-lg font-bold text-foreground truncate">{title}</h1>
      </div>

      <article className="px-4 py-6 space-y-5 text-sm leading-relaxed text-foreground">
        <p className="text-xs text-muted-foreground">Dernière mise à jour : {lastUpdated}</p>
        {children}
        <div className="pt-6 border-t border-border text-xs text-muted-foreground">
          <p>
            Pour toute question, écrivez-nous à{" "}
            <a href="mailto:support@qmaps.app" className="text-primary underline">
              support@qmaps.app
            </a>
            .
          </p>
        </div>
      </article>

      <BottomNav />
    </div>
  );
};

export default LegalPageLayout;
