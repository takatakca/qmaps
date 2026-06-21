import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowRight } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CheckoutGuidanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destination?: string;
  title?: string;
  description?: string;
}

const CheckoutGuidanceDialog = ({
  open,
  onOpenChange,
  destination = "/merchant/billing/plans",
  title = "Continuer vers les plans QMAPS",
  description = "Vous serez redirigé vers une page sécurisée. QMAPS ne collecte jamais votre carte directement. Les paiements et abonnements passent par Stripe lorsque la facturation est activée.",
}: CheckoutGuidanceDialogProps) => {
  const navigate = useNavigate();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <AlertDialogTitle className="text-center font-heading">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction
            onClick={() => navigate(destination)}
            className="w-full rounded-full gap-2"
          >
            Continuer vers les plans <ArrowRight size={16} />
          </AlertDialogAction>
          <AlertDialogCancel className="w-full rounded-full mt-0">Annuler</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CheckoutGuidanceDialog;
