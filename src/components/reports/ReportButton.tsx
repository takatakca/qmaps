import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useCreateReport, type ReportTargetType } from "@/hooks/useReports";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Props {
  targetType: ReportTargetType;
  targetId: string;
  variant?: "ghost" | "outline" | "secondary" | "default";
  size?: "sm" | "default" | "icon";
  label?: string;
  iconOnly?: boolean;
}

const REASONS = [
  { value: "spam", label: "Spam ou publicité" },
  { value: "inappropriate", label: "Contenu inapproprié" },
  { value: "harassment", label: "Harcèlement" },
  { value: "false_info", label: "Fausse information" },
  { value: "duplicate", label: "Doublon" },
  { value: "other", label: "Autre" },
];

const ReportButton = ({
  targetType,
  targetId,
  variant = "ghost",
  size = "sm",
  label = "Signaler",
  iconOnly = false,
}: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { submit, submitting } = useCreateReport();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!reason) {
      toast({ title: "Sélectionnez un motif", variant: "destructive" });
      return;
    }
    try {
      await submit({ target_type: targetType, target_id: targetId, reason, details });
      toast({ title: "Signalement envoyé", description: "Notre équipe va examiner votre signalement." });
      setOpen(false);
      setReason("");
      setDetails("");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-1.5">
          <Flag size={14} />
          {!iconOnly && <span>{label}</span>}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Signaler ce contenu</DialogTitle>
          <DialogDescription>
            Aidez-nous à garder QMaps sûr. Votre signalement reste confidentiel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Motif</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un motif" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Détails (facultatif)</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Donnez plus de contexte..."
              maxLength={500}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Envoi..." : "Envoyer le signalement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportButton;
