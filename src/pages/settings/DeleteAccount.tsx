import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  DELETE_CONFIRMATION_TOKEN,
  isDeletionConfirmationValid,
  STATUS_LABELS_FR,
  type AccountDeletionStatus,
} from "@/lib/accountDeletion";

interface ExistingRequest {
  id: string;
  status: AccountDeletionStatus;
  requested_at: string;
}

const DeleteAccount = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [confirmation, setConfirmation] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState<ExistingRequest | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    const fetchExisting = async () => {
      const { data } = await supabase
        .from("account_deletion_requests")
        .select("id, status, requested_at")
        .eq("user_id", user.id)
        .in("status", ["pending", "processing"])
        .order("requested_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setExisting((data as ExistingRequest) ?? null);
      setLoadingExisting(false);
    };
    fetchExisting();
  }, [user, authLoading, navigate]);

  const canSubmit = isDeletionConfirmationValid(confirmation) && !submitting && !existing;

  const handleSubmit = async () => {
    if (!user) return;
    if (!isDeletionConfirmationValid(confirmation)) {
      toast({
        title: "Confirmation invalide",
        description: `Veuillez taper exactement « ${DELETE_CONFIRMATION_TOKEN} » pour confirmer.`,
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("account_deletion_requests")
      .insert({
        user_id: user.id,
        reason: reason.trim() || null,
        status: "pending",
      })
      .select("id, status, requested_at")
      .maybeSingle();
    setSubmitting(false);
    if (error) {
      toast({
        title: "Échec de la demande",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setExisting((data as ExistingRequest) ?? null);
    setConfirmation("");
    setReason("");
    toast({
      title: "Demande enregistrée",
      description: "Notre équipe traitera votre demande sous peu.",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-safe max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3 pt-safe">
        <button
          onClick={() => navigate(-1)}
          aria-label="Retour"
          className="min-tap flex items-center justify-center"
        >
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="font-heading text-lg font-bold text-foreground">Fermer mon compte</h1>
      </div>

      <div className="px-4 py-5 space-y-5">
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex gap-3">
          <ShieldAlert size={20} className="text-destructive shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-destructive">Action irréversible</p>
            <p className="text-foreground">
              Votre demande sera examinée par notre équipe avant la suppression définitive.
              Pour préserver l'intégrité de la plateforme, certaines données pourront être
              <strong> anonymisées plutôt que supprimées</strong>, notamment :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Avis publiés (anonymisés)</li>
              <li>Historique de modération</li>
              <li>Réclamations d'entreprise</li>
              <li>Registres de facturation et journaux d'audit</li>
            </ul>
            <p className="text-muted-foreground">
              Consultez notre{" "}
              <a
                href="/docs/account-deletion-policy.md"
                className="text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                politique de suppression de compte
              </a>{" "}
              pour les détails complets.
            </p>
          </div>
        </div>

        {loadingExisting ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 size={16} className="animate-spin" /> Vérification…
          </div>
        ) : existing ? (
          <div className="bg-muted/50 border border-destructive/30 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-destructive">
              Une demande est déjà active.
            </p>
            <p className="text-sm text-foreground">
              Statut : <strong>{STATUS_LABELS_FR[existing.status]}</strong>
              <br />
              Soumise le {new Date(existing.requested_at).toLocaleDateString("fr-CA")}
            </p>
            <p className="text-xs text-muted-foreground">
              Pour annuler ou modifier votre demande, contactez le support à{" "}
              <span className="font-mono">support@qmaps.app</span>. Aucune nouvelle demande ne peut être créée tant que celle-ci est active.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Raison (facultatif)
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Aidez-nous à comprendre votre choix…"
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Tapez <span className="font-mono text-destructive">{DELETE_CONFIRMATION_TOKEN}</span> pour confirmer
              </label>
              <Input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={DELETE_CONFIRMATION_TOKEN}
                autoComplete="off"
                aria-label="Confirmation de suppression"
              />
            </div>

            <Button
              variant="destructive"
              className="w-full min-tap"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" /> Envoi…
                </>
              ) : (
                "Soumettre la demande de fermeture"
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default DeleteAccount;
