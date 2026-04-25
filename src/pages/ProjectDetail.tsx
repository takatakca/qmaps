import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, DollarSign, Clock, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useProjectQuotes, type ProjectQuote, type ProjectQuoteMessage } from "@/hooks/useProjectQuotes";
import type { ProjectRequest } from "@/hooks/useProjectRequests";

interface BusinessLite { id: string; name: string; image_url: string | null; }

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [request, setRequest] = useState<ProjectRequest | null>(null);
  const [loadingReq, setLoadingReq] = useState(true);
  const [businesses, setBusinesses] = useState<Record<string, BusinessLite>>({});
  const { quotes, loading, sendQuoteMessage, fetchQuoteMessages } = useProjectQuotes(id);
  const [openQuoteId, setOpenQuoteId] = useState<string | null>(null);
  const [thread, setThread] = useState<ProjectQuoteMessage[]>([]);
  const [reply, setReply] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoadingReq(true);
    supabase
      .from("project_requests" as any)
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setRequest((data as unknown) as ProjectRequest | null);
        setLoadingReq(false);
      });
  }, [id]);

  useEffect(() => {
    if (quotes.length === 0) return;
    const ids = Array.from(new Set(quotes.map(q => q.business_id)));
    supabase.from("businesses").select("id, name, image_url").in("id", ids).then(({ data }) => {
      const map: Record<string, BusinessLite> = {};
      (data ?? []).forEach((b: any) => { map[b.id] = b; });
      setBusinesses(map);
    });
  }, [quotes]);

  const openThread = async (quoteId: string) => {
    setOpenQuoteId(quoteId);
    const { data } = await fetchQuoteMessages(quoteId);
    setThread(data);
  };

  const sendReply = async () => {
    if (!openQuoteId || !reply.trim()) return;
    const { error } = await sendQuoteMessage(openQuoteId, reply.trim());
    if (error) {
      toast({ title: "Erreur", description: error, variant: "destructive" });
      return;
    }
    setReply("");
    const { data } = await fetchQuoteMessages(openQuoteId);
    setThread(data);
  };

  if (loadingReq) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto px-4 pt-6">
        <p className="text-muted-foreground">Projet introuvable.</p>
        <Button className="mt-4" onClick={() => navigate("/projects")}>Retour</Button>
      </div>
    );
  }

  const isOwner = user?.id === request.user_id;

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center mb-3">
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="font-heading text-xl font-bold text-foreground flex-1">{request.title}</h1>
          <Badge variant="secondary" className="capitalize">{request.status}</Badge>
        </div>

        {request.description && <p className="text-sm text-muted-foreground mb-4">{request.description}</p>}

        <div className="grid grid-cols-2 gap-2 mb-5">
          {request.city && (
            <Card className="p-3 flex items-center gap-2">
              <MapPin size={14} className="text-muted-foreground" />
              <span className="text-xs text-foreground">{request.city}</span>
            </Card>
          )}
          {(request.budget_min || request.budget_max) && (
            <Card className="p-3 flex items-center gap-2">
              <DollarSign size={14} className="text-muted-foreground" />
              <span className="text-xs text-foreground">
                {request.budget_min ?? "?"}–{request.budget_max ?? "?"} $
              </span>
            </Card>
          )}
          <Card className="p-3 flex items-center gap-2">
            <Clock size={14} className="text-muted-foreground" />
            <span className="text-xs text-foreground capitalize">{request.urgency}</span>
          </Card>
        </div>

        <h2 className="font-heading text-base font-bold text-foreground mb-2">
          Devis reçus {quotes.length > 0 && <span className="text-muted-foreground">({quotes.length})</span>}
        </h2>

        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : quotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun devis pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {quotes.map(q => (
              <QuoteCard
                key={q.id}
                quote={q}
                business={businesses[q.business_id]}
                isOwner={isOwner}
                onOpenThread={() => openThread(q.id)}
                expanded={openQuoteId === q.id}
                thread={openQuoteId === q.id ? thread : []}
                reply={reply}
                onReplyChange={setReply}
                onSendReply={sendReply}
              />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

interface QuoteCardProps {
  quote: ProjectQuote;
  business?: BusinessLite;
  isOwner: boolean;
  onOpenThread: () => void;
  expanded: boolean;
  thread: ProjectQuoteMessage[];
  reply: string;
  onReplyChange: (v: string) => void;
  onSendReply: () => void;
}

const QuoteCard = ({ quote, business, onOpenThread, expanded, thread, reply, onReplyChange, onSendReply }: QuoteCardProps) => (
  <Card className="p-3">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
        {business?.image_url && <img src={business.image_url} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{business?.name ?? "Entreprise"}</p>
        {(quote.quoted_price_min || quote.quoted_price_max) && (
          <p className="text-xs text-primary font-medium">
            {quote.quoted_price_min ?? "?"}–{quote.quoted_price_max ?? "?"} $
          </p>
        )}
        {quote.message && <p className="text-xs text-muted-foreground mt-1">{quote.message}</p>}
        <button
          onClick={onOpenThread}
          className="text-xs text-primary mt-2 inline-flex items-center gap-1"
        >
          <MessageSquare size={12} /> {expanded ? "Masquer" : "Discussion"}
        </button>

        {expanded && (
          <div className="mt-3 border-t border-border pt-3 space-y-2">
            {thread.length === 0 && (
              <p className="text-xs text-muted-foreground">Aucun message.</p>
            )}
            {thread.map(m => (
              <div key={m.id} className="text-xs bg-muted/50 rounded-lg p-2">
                {m.body}
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <Textarea
                value={reply}
                onChange={e => onReplyChange(e.target.value)}
                rows={2}
                placeholder="Votre message..."
                className="text-xs"
              />
              <Button size="sm" onClick={onSendReply} disabled={!reply.trim()}>Envoyer</Button>
            </div>
          </div>
        )}
      </div>
      <Badge variant="secondary" className="text-[10px] shrink-0 capitalize">{quote.status}</Badge>
    </div>
  </Card>
);

export default ProjectDetail;
