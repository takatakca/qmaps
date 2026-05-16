import { Shield, Megaphone } from "lucide-react";
import type { AdFormData } from "@/pages/MerchantAds";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  formData: AdFormData;
  update: (p: Partial<AdFormData>) => void;
  business: Tables<"businesses">;
}

const AdStepPayment = ({ formData }: Props) => {
  const daily = formData.customBudget || formData.budgetPreset;
  const upgradeCost = formData.upgradePackage ? 4 : 0;
  const total = daily + upgradeCost;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Shield size={14} /> Paiement sécurisé via Stripe
      </div>

      {/* Order summary */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex justify-between mb-4">
          <h3 className="font-heading font-bold text-foreground">Résumé de la commande</h3>
        </div>
        <div className="space-y-3 border-b border-border pb-3 mb-3">
          <div className="flex items-start gap-3">
            <Megaphone size={18} className="text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Budget publicitaire QMAPS</p>
              <p className="text-xs text-muted-foreground">Environ {Math.round(daily * 38.5)} clics par mois</p>
            </div>
            <p className="text-sm font-semibold text-foreground">{daily} CA$/jour</p>
          </div>
          {formData.upgradePackage && (
            <div className="flex items-start gap-3">
              <Megaphone size={18} className="text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Package Upgrade</p>
                <p className="text-xs text-muted-foreground">Suppression concurrents, CTA, mise en avant, logo, diaporama, QMAPS Connect</p>
              </div>
              <p className="text-sm font-semibold text-foreground">4 CA$/jour</p>
            </div>
          )}
        </div>
        <div className="flex justify-between">
          <p className="font-bold text-foreground">Total</p>
          <p className="font-bold text-foreground">{total} CA$/jour moyenne</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Les dépenses quotidiennes peuvent varier, mais vous ne serez jamais facturé plus de {total * 30},00 CA$/mois max.
        </p>
      </div>

      <div className="bg-muted/50 rounded-xl p-4 space-y-2">
        <p className="text-sm font-semibold text-foreground">Paiement sécurisé hébergé</p>
        <p className="text-xs text-muted-foreground">
          QMAPS ne collecte jamais directement votre numéro de carte. Tous les paiements sont traités via Stripe, dans une page de paiement hébergée et conforme PCI.
        </p>
        <p className="text-xs text-muted-foreground">
          Vous serez redirigé vers votre page de facturation pour choisir un plan et entrer vos informations de paiement en toute sécurité.
        </p>
      </div>
    </div>
  );
};

export default AdStepPayment;
