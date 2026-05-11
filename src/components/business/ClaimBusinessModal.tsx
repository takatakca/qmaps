import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { canSubmitClaimRequest } from "@/lib/claimRequests";

interface ClaimBusinessModalProps {
  businessId: string;
  businessName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_contact_name: "Veuillez indiquer votre nom.",
  missing_email: "Courriel professionnel requis.",
  invalid_email: "Courriel invalide.",
  invalid_evidence_url: "L'URL de preuve doit commencer par http(s)://",
};

const ClaimBusinessModal = ({ businessId, businessName, open, onOpenChange }: ClaimBusinessModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingExisting, setPendingExisting] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    void (async () => {
      const { data } = await (supabase as any)
        .from("business_claim_requests")
        .select("id")
        .eq("business_id", businessId)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .limit(1)
        .maybeSingle();
      setPendingExisting(!!data);
    })();
  }, [open, user, businessId]);

  const handleSubmit = async () => {
    if (!user) {
      onOpenChange(false);
      navigate("/auth");
      return;
    }
    const result = canSubmitClaimRequest({
      contact_name: contactName,
      business_email: email,
      business_phone: phone,
      message,
      evidence_url: evidenceUrl,
    });
    if (result.ok === false) {
      toast({ title: "Vérifiez vos infos", description: ERROR_MESSAGES[result.error], variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await (supabase as any).from("business_claim_requests").insert({
      business_id: businessId,
      user_id: user.id,
      status: "pending",
      ...result.data,
    });
    setSubmitting(false);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Demande envoyée", description: "Notre équipe vérifiera votre demande." });
    setPendingExisting(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" /> Revendiquer ce commerce
          </DialogTitle>
          <DialogDescription>
            Confirmez que vous êtes le propriétaire ou le gérant de <strong>{businessName}</strong>.
          </DialogDescription>
        </DialogHeader>

        {pendingExisting ? (
          <p className="text-sm text-muted-foreground py-4">
            Votre demande de revendication est en cours de vérification.
          </p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Votre nom *</label>
              <Input value={contactName} maxLength={100} onChange={(e) => setContactName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Courriel professionnel *</label>
              <Input type="email" value={email} maxLength={254} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Téléphone</label>
              <Input value={phone} maxLength={30} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">URL de preuve (facture, site officiel…)</label>
              <Input value={evidenceUrl} maxLength={500} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Message</label>
              <Textarea value={message} rows={3} maxLength={500} onChange={(e) => setMessage(e.target.value)} placeholder="Expliquez votre lien avec le commerce…" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Annuler</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 size={14} className="animate-spin mr-2" />}
                Envoyer la demande
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClaimBusinessModal;
