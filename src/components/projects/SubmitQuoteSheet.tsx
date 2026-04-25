import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useProjectQuotes } from "@/hooks/useProjectQuotes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

interface MerchantBusiness {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectRequestId: string;
  onSubmitted?: () => void;
}

const SubmitQuoteSheet = ({ open, onOpenChange, projectRequestId, onSubmitted }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createQuote } = useProjectQuotes(projectRequestId);

  const [businesses, setBusinesses] = useState<MerchantBusiness[]>([]);
  const [businessId, setBusinessId] = useState<string | undefined>();
  const [message, setMessage] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !open) return;
    supabase.from("businesses").select("id, name").eq("owner_user_id", user.id).then(({ data }) => {
      const list = (data ?? []) as MerchantBusiness[];
      setBusinesses(list);
      if (list.length > 0 && !businessId) setBusinessId(list[0].id);
    });
  }, [user, open, businessId]);

  const handleSubmit = async () => {
    if (!businessId) {
      toast({ title: "Choisissez une entreprise", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await createQuote({
      project_request_id: projectRequestId,
      business_id: businessId,
      message: message.trim() || null,
      quoted_price_min: priceMin ? Number(priceMin) : null,
      quoted_price_max: priceMax ? Number(priceMax) : null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Erreur", description: error, variant: "destructive" });
      return;
    }
    toast({ title: "Devis envoyé" });
    setMessage(""); setPriceMin(""); setPriceMax("");
    onOpenChange(false);
    onSubmitted?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Envoyer un devis</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-8">
          <div>
            <Label className="text-xs">Entreprise</Label>
            <Select value={businessId} onValueChange={setBusinessId}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                {businesses.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Prix min ($)</Label>
              <Input type="number" inputMode="numeric" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Prix max ($)</Label>
              <Input type="number" inputMode="numeric" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Message au client</Label>
            <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
              placeholder="Présentez votre offre..." />
          </div>

          <Button onClick={handleSubmit} disabled={submitting || businesses.length === 0} className="w-full rounded-full">
            {submitting ? "Envoi..." : "Envoyer le devis"}
          </Button>
          {businesses.length === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Vous devez posséder une entreprise pour envoyer un devis.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SubmitQuoteSheet;
