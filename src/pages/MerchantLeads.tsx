import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Inbox } from "lucide-react";
import MerchantBottomNav from "@/components/MerchantBottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMerchantLeads } from "@/hooks/useMerchantLeads";
import SubmitQuoteSheet from "@/components/projects/SubmitQuoteSheet";

const MerchantLeads = () => {
  const navigate = useNavigate();
  const { leads, loading, refresh } = useMerchantLeads();
  const [quoteFor, setQuoteFor] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-heading text-xl font-bold text-foreground">Demandes de projet</h1>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : leads.length === 0 ? (
          <div className="text-center py-16">
            <Inbox size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Aucune demande pour le moment.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Configurez vos catégories de service pour recevoir des demandes.
            </p>
            <Button className="mt-4" onClick={() => navigate("/merchant/services")}>
              Configurer mes services
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map(lead => (
              <Card key={lead.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-foreground flex-1">{lead.title}</p>
                  <Badge variant="secondary" className="text-[10px] capitalize">{lead.urgency}</Badge>
                </div>
                {lead.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{lead.description}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-muted-foreground">
                  {lead.city && <span>{lead.city}</span>}
                  {(lead.budget_min || lead.budget_max) && (
                    <span>{lead.budget_min ?? "?"}–{lead.budget_max ?? "?"} $</span>
                  )}
                </div>
                <Button
                  size="sm"
                  className="mt-3 rounded-full"
                  onClick={() => setQuoteFor(lead.id)}
                >
                  Envoyer un devis
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {quoteFor && (
        <SubmitQuoteSheet
          open={!!quoteFor}
          onOpenChange={open => !open && setQuoteFor(null)}
          projectRequestId={quoteFor}
          onSubmitted={refresh}
        />
      )}

      <MerchantBottomNav />
    </div>
  );
};

export default MerchantLeads;
