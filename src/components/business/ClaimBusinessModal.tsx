import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useClaimBusiness } from "@/hooks/useClaimBusiness";
import { useToast } from "@/hooks/use-toast";

interface ClaimBusinessModalProps {
  businessId: string;
  businessName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ClaimBusinessModal = ({ businessId, businessName, open, onOpenChange }: ClaimBusinessModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { status, requestClaim } = useClaimBusiness(businessId);

  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      onOpenChange(false);
      navigate("/auth");
      return;
    }
    if (!contactName.trim() || !email.trim()) {
      toast({ title: "Nom et courriel requis", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const note = JSON.stringify({
        contact_name: contactName.trim(),
        business_email: email.trim(),
        business_phone: phone.trim() || null,
        message: message.trim() || null,
      });
      await requestClaim(note);
      toast({ title: "Demande envoyée", description: "Notre équipe vérifiera votre demande." });
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      toast({
        title: msg === "claim-pending" ? "Demande déjà en cours" : "Erreur",
        description: msg === "claim-pending" ? "Votre demande est en attente de vérification." : msg,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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

        {status === "pending" ? (
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
              <Input type="email" value={email} maxLength={255} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Téléphone</label>
              <Input value={phone} maxLength={30} onChange={(e) => setPhone(e.target.value)} />
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
